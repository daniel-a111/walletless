pragma solidity ^0.8.9;

import "./IRGFProvider.sol";
import "./StringsHandler.sol";
import "hardhat/console.sol";

contract WalletLess is StringsHandler {

    uint public nonce;
    bytes32 public cert;
    uint public nonceSize;
    mapping(uint8 => Transaction) public pending;
    uint8 public pendingCounter;
    bool public active = false;

    IRGFProvider public rgfProvider;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bytes32 cert;
    }

    event AddPending(uint i, uint nonce, address to, uint value, bytes data, bytes32 cert);
    event Expose(bytes32 proof, uint skip);
    event SubmitTransaction(uint i, uint nonce, address to, uint value, bytes data);

    function init(bytes32 cert_, uint nonceSize_, IRGFProvider rgfProvider_) public {
        require(!active, "already active");
        cert = cert_;
        nonceSize = nonceSize_;
        nonce = 0;
        pendingCounter = 0;
        active = true;
        rgfProvider = rgfProvider_;
    }

    function resetPassword(bytes32 cert_, uint nonceSize_) external {
        require(msg.sender == address(this), "internal only");
        cert = cert_;
        nonceSize = nonceSize_;
        nonce = 0;
        pendingCounter = 0;
    }

    function setRGFProvider(IRGFProvider rgfProvider_) external {
        require(msg.sender == address(this), "internal only");
        rgfProvider = rgfProvider_;
    }

    function topup() payable public {}

    function auth(bytes32 proof, uint skip) private returns (bool) {
        bytes memory byteProof = abi.encodePacked(proof);
        for (uint i = 0; i < skip; i++) {
            byteProof = abi.encodePacked(sha256(byteProof));
        }
        console.log('cert: %o', toString(cert));
        console.log('proof: %o', toString(byteProof));
        console.log('hashed proof: %o', toString(sha256(byteProof)));
        // console.log('test %o', 123);
        if (strEqual(sha256(byteProof), cert)) {
            nonce++;
            cert = proof;
            pendingCounter = 0;
            return true;
        }
        return false;
    }

    function call(address to, uint value, bytes memory data, bytes32 cert) public payable {
        require(msg.value >= rgfProvider.get(), "insufficiant RGF");
        pending[pendingCounter] = Transaction({
            to: to, value: value, data: data, cert: cert
        });
        emit AddPending(pendingCounter, nonce, to, value, data, cert);
        pendingCounter++;
    }

    function verifyRecord(uint8 i, bytes32 proof) public view returns(bool) {
        return _recordVerify(pending[i], proof);
    }

    function _recordVerify(Transaction memory tr, bytes32 proof) private pure returns(bool) {
        return sha256(recordToBytes(tr, proof)) == tr.cert;
    }

    function recordToBytes(Transaction memory tr, bytes32 proof) public pure returns(bytes memory) {
        bytes memory pendingRecord = abi.encodePacked(tr.to);
        pendingRecord = bytes.concat(pendingRecord, abi.encodePacked(tr.value));
        pendingRecord = bytes.concat(pendingRecord, tr.data);
        pendingRecord = bytes.concat(pendingRecord, abi.encodePacked(proof));
        return pendingRecord;
    }

    function recordToString(uint8 i, bytes32 proof) public view returns(string memory) {
        return toString(recordToBytes(pending[i], proof));
    }

    function expose(bytes32 proof, uint skip) public {
        uint lastPendingCounter = pendingCounter;
        // console.log('test %o', 123);
        // console.log('test %o', toString(proof));
        require(auth(proof, 0), "auth failed");
        emit Expose(proof, skip);
        for (uint8 i = 0; i < lastPendingCounter; i++) {
            Transaction memory tr = pending[i];
            if (_recordVerify(tr, proof)) {
                emit SubmitTransaction(i, nonce, tr.to, tr.value, tr.data);
                tr.to.call{value: tr.value}(bytes(tr.data));
                return;
            }
        }
    }

    function callTest(address to, uint value, bytes calldata data) public {
        // emit SubmitTransaction(0, 0, to, value, data);
        to.call{value: value}(data);
        emit SubmitTransaction(1, 0, to, value, data);
    }

    // function callTest2(uint i1, uint i2, uint i3) public {
    //     rgfProvider.set(i1, i2, i3);
    //     // emit SubmitTransaction(0, 0, to, value, data);
    // }
}