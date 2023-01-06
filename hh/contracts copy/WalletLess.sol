pragma solidity ^0.8.9;

import "./IRGFProvider.sol";
import "./StringsHandler.sol";

struct Transaction {
    address to;
    uint value;
    bytes data;
    bytes32 cert;
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

contract WalletLess is StringsHandler {

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

    event RGFShouldBe(uint gasPrice, uint dataLength, uint expected, uint actual);
    event AddPending(uint i, uint nonce, address to, uint value, bytes data, bytes32 cert);
    event Expose(bytes32 proof, uint skip);
    event SubmitTransaction(uint i, uint nonce, address to, uint value, bytes data);

    address public initializer;
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

    function payment() payable public {}

    function auth(bytes32 proof, uint skip) private returns (bool) {
        bytes memory byteProof = abi.encodePacked(proof);
        for (uint i = 0; i < skip; i++) {
            byteProof = abi.encodePacked(sha256(byteProof));
        }
        if (strEqual(sha256(byteProof), cert)) {
            nonce++;
            if (pendingCounter == 255) {
                pendingAttackCounter++;
            }
            cert = proof;
            txProcessing = true;
        }
        return txProcessing;
    }

    function call(address to, uint value, bytes memory data, bytes32 cert) public payable {
        require(!txProcessing, "cannot interupt processing state");
        require(msg.value >= rgfProvider.get(data.length, pendingAttackCounter), "insufficiant RGF");
        pending[pendingCounter] = Transaction({
            to: to, value: value, data: data, cert: cert
        });
        emit AddPending(pendingCounter, nonce, to, value, data, cert);
        pendingCounter++;
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
        bytes memory pendingRecord = abi.encodePacked(tr.to);
        pendingRecord = bytes.concat(pendingRecord, abi.encodePacked(tr.value));
        pendingRecord = bytes.concat(pendingRecord, tr.data);
        pendingRecord = bytes.concat(pendingRecord, abi.encodePacked(proof));
        return pendingRecord;
    }

    function recordToString(uint8 i, bytes32 proof) public view returns(string memory) {
        return toString(recordToBytes(pending[i], proof));
    }

    function expose(bytes32 proof, uint skip) external {
        require(!txProcessing, "cannot interupt processing state");
        uint lastPendingCounter = pendingCounter;
        require(auth(proof, 0), "auth failed");
        emit Expose(proof, skip);
        exposeCont();
    }

    function exposeCont() public {
        require(txProcessing, "not processing...");
        for (uint8 i = processingCursor; i < pendingCounter; i++) {
            if (gasleft() < 50_000+pending[i].data.length*50) {
                processingCursor = i;
                return;
            }
            Transaction memory tr = pending[i];
            if (_recordVerify(tr, cert)) {
                if (tr.to != address(0)) {  // for skipping
                    emit SubmitTransaction(i, nonce, tr.to, tr.value, tr.data);
                    pendingAttackCounter = 0;
                    tr.to.call{value: tr.value}(bytes(tr.data));
                }
                break;
            }
        }
        txProcessing = false;
        pendingCounter = 0;
    }


    function resetPassword(bytes32 cert_) external {
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