pragma solidity ^0.8.9;

import "./IRGFProvider.sol";
import "./StringsHandler.sol";
import "hardhat/console.sol";

struct Transaction {
    address to;
    uint value;
    bytes data;
    bytes32 cert;
    uint rgf;
    address deliver;
}

struct AccountState {
    uint nonce;
    bytes32 cert;
    Transaction[] pending;
    uint8 pendingCounter;
    uint pendingAttackCounter;
    bool active;
    bool txProcessing;
    uint8 processingCursor;
    IRGFProvider rgfProvider;
}

contract Walletless is StringsHandler {

    uint nonce;
    bytes32 cert;
    mapping(uint8 => Transaction) public pending;
    uint pendingAttackCounter;
    uint8 pendingCounter;
    bool active = false;
    bool txProcessing;
    uint8 processingCursor;
    IRGFProvider rgfProvider;


    error InsufficiantRGF(uint dataLength, uint expected, uint actual);
    event AddPending(uint i, uint nonce, address to, uint value, bytes data, bytes32 cert);
    event Skip(uint nonce);
    event NoneMatches(uint nonce);
    event TxDone(uint pending, uint nonce, address to, uint value, bytes data);
    event TxReverted(uint pending, uint nonce, address to, uint value, bytes data, string message);
    event GasStop();

    address public immutable initializer;
    constructor() {
        initializer = msg.sender;
    }
    
    function init(bytes32 cert_, IRGFProvider rgfProvider_) public {
        require(msg.sender == initializer, "initializer only");
        require(!active, "already active");
        cert = cert_;
        nonce = 0;
        pendingCounter = 0;
        active = true;
        rgfProvider = rgfProvider_;
    }

    fallback() external payable  {}

    function auth(bytes32 proof, uint skip) private returns (bool) {
        bytes memory byteProof = abi.encodePacked(proof);
        for (uint i = 0; i < skip; i++) {
            byteProof = abi.encodePacked(sha256(byteProof));
        }
        if (strEqual(sha256(abi.encodePacked(sha256(byteProof))), cert)) {
            nonce++;
            if (pendingCounter == 255) {
                pendingAttackCounter++;
            }
            cert = proof;
            txProcessing = true;
        }
        return txProcessing;
    }

    function getState() public view returns (AccountState memory) {
        Transaction[] memory pending_ = new Transaction[](pendingCounter);
        for (uint8 i = 0; i < pendingCounter; i++) {
            pending_[i] = pending[i];
        }
        return AccountState({
            nonce: nonce,
            cert: cert,
            pending: pending_,
            pendingAttackCounter: pendingAttackCounter,
            pendingCounter: pendingCounter,
            active: active,
            txProcessing: txProcessing,
            processingCursor: processingCursor,
            rgfProvider: rgfProvider
        });
    }

    function verifyRecord(uint8 i, bytes32 proof) public view returns(bool) {
        return _recordVerify(pending[i], proof);
    }

    function _recordVerify(Transaction memory tr, bytes32 proof) internal pure returns(bool) {
        return sha256(recordToBytes(tr, proof)) == tr.cert;
    }

    function recordToBytes(Transaction memory tr, bytes32 proof) internal pure returns(bytes memory) {
        bytes memory pendingRecord = abi.encodePacked(tr.to, tr.value, tr.data, proof);
        return pendingRecord;
    }

    function recordToString(uint8 i, bytes32 proof) public view returns(string memory) {
        return toString(recordToBytes(pending[i], proof));
    }

    function preset(address to, uint value, bytes memory data, bytes32 cert) public payable {
        require(!txProcessing, "cannot interupt processing state");
        require(msg.value >= rgfProvider.get(data.length, pendingAttackCounter), "insufficiant RGF");
        pending[pendingCounter] = Transaction({
            to: to, value: value, data: data, cert: cert, rgf: msg.value, deliver: msg.sender
        });
        emit AddPending(pendingCounter, nonce, to, value, data, cert);
        pendingCounter++;
    }

    function expose(bytes32 proof, uint skip) external {
        require(!txProcessing, "cannot interupt processing state");
        uint lastPendingCounter = pendingCounter;
        require(auth(proof, skip), "auth failed");
        exposeCont();
    }

    function exposeCont() public {
        require(txProcessing, "not processing...");
        uint8 found = 255;
        for (uint8 i = processingCursor; i < pendingCounter; i++) {
            if (gasleft() < 50_000+pending[i].data.length*50) {
                processingCursor = i;
                emit GasStop();
                return;
            }
            Transaction memory tr = pending[i];
            if (_recordVerify(tr, cert)) {
                payable(tr.deliver).transfer(tr.rgf);
                if (tr.to != address(0)) {  // for skipping
                    found = i;
                    pendingAttackCounter = 0;
                    (bool success, bytes memory data) = tr.to.call{value: tr.value}(bytes(tr.data));
                    if (success) {
                        emit TxDone(i, nonce-1, tr.to, tr.value, tr.data);
                    } else {
                        emit TxReverted(i, nonce-1, tr.to, tr.value, tr.data, _getRevertMsg(data));
                    }
                    console.log('success: %o', "sdfsdf");
                } else {
                    emit Skip(nonce-1);
                }
                break;
            } else {
                payable(msg.sender).transfer(tr.rgf);
            }
        }
        if (found == 255) {
            emit NoneMatches(nonce);
        }
        txProcessing = false;
        pendingCounter = 0;
    }

    function _getRevertMsg(bytes memory _returnData) internal pure returns (string memory) {
        // If the _res length is less than 68, then the transaction failed silently (without a revert message)
        if (_returnData.length < 68) return 'Transaction reverted silently';

        assembly {
            // Slice the sighash.
            _returnData := add(_returnData, 0x04)
        }
        return abi.decode(_returnData, (string)); // All that remains is the revert string
    }
    function resetCert(bytes32 cert_) external {
        require(msg.sender == address(this), "internal only");
        cert = cert_;
        nonce = 0;
        pendingCounter = 0;
    }

    function setRGFProvider(IRGFProvider rgfProvider_) external {
        require(msg.sender == address(this), "internal only");
        rgfProvider = rgfProvider_;
    }
}