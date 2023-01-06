pragma solidity ^0.8.9;

import "./IRGFProvider.sol";



struct Preset {
    address to;
    uint value;
    bytes data;
    bytes32 cert;
    uint rgf;
    address deliver;
}

struct AccountState {
    bytes32 cert;
    bytes32 processing;
    Preset[] pending;
    uint presetCursor;
    uint processingCursor;
    IRGFProvider rgfProvider;
}



contract Walletless {

    bytes32 constant NONE = bytes32(0);

    bytes32 cert_;
    bytes32 processing_;
    mapping(uint => Preset) public presets_;
    uint presetCursor_;
    uint processingCursor_;
    IRGFProvider rgfProvider_;

    event Skip(bytes32 nonce);
    event NoneMatches(bytes32 nonce);
    event TxDone(bytes32 nonce, address to, uint value, bytes data);
    event TxReverted(bytes32 nonce, address to, uint value, bytes data, string message);
    event GasStop();


    fallback() external payable  {
        // require(cert_ != bytes32(0), "!!!");
    }


    address public immutable initializer;
    constructor() {
        initializer = msg.sender;
    }

    function init(bytes32 cert, IRGFProvider rgfProvider) public {
        require(msg.sender == initializer, "initializer only");
        require(cert_ == NONE, "cannot interupt processing state");
        cert_ = cert;
        presetCursor_ = 0;
        rgfProvider_ = rgfProvider;
    }


    function getState() public view returns (AccountState memory) {
        Preset[] memory pending_ = new Preset[](presetCursor_);
        for (uint8 i = 0; i < presetCursor_; i++) {
            pending_[i] = presets_[i];
        }
        return AccountState({
            cert: cert_,
            pending: pending_,
            presetCursor: presetCursor_,
            processing: processing_,
            processingCursor: processingCursor_,
            rgfProvider: rgfProvider_
        });
    }


    function auth(bytes32 proof, uint skip) private returns (bool) {
        bytes memory byteProof = abi.encodePacked(proof);
        for (uint i = 0; i < skip; i++) {
            byteProof = abi.encodePacked(sha256(byteProof));
        }
        if (sha256(abi.encodePacked(sha256(byteProof))) == cert_) {
            processing_ = cert_;
            cert_ = proof;
            return true;
        }
        return false;
    }


    function verifyRecord(uint8 i, bytes32 proof) public view returns(bool) {
        return _recordVerify(presets_[i], proof);
    }

    function _recordVerify(Preset memory tr, bytes32 proof) internal pure returns(bool) {
        return sha256(recordToBytes(tr, proof)) == tr.cert;
    }

    function recordToBytes(Preset memory tr, bytes32 proof) internal pure returns(bytes memory) {
        return abi.encodePacked(tr.to, tr.value, tr.data, proof);
    }

    function preset(address to, uint value, bytes memory data, bytes32 cert) public payable { // 5229
        require(processing_ == NONE, "cannot interupt processing state");
        require(msg.value >= rgfProvider_.get(data.length, presetCursor_), "insufficiant RGF");
        presets_[presetCursor_++] = Preset({
            to: to, value: value, data: data, cert: cert, rgf: msg.value, deliver: msg.sender
        });
    }

    function expose(bytes32 proof, uint skip) external {
        require(processing_ == NONE, "cannot interupt processing state");
        require(auth(proof, skip), "auth failed");
        exposeCont();
    }

    function exposeCont() public {
        require(processing_ != NONE, "not processing...");
        _presetMatchingProcess();
    }

    function _presetMatchingProcess() internal {
        for (uint i = processingCursor_; i < presetCursor_; i++) {
            Preset memory tr = presets_[i];
            if (gasleft() < 50_000+tr.data.length*50) {
                return _gas_stop();
            }
            if (_recordVerify(tr, cert_)) {
                payable(tr.deliver).transfer(tr.rgf); // 4473
                return _finalize_found_expose(i);
            } else {
                payable(msg.sender).transfer(tr.rgf); // 4564
            }
        }
        return _finalize_none_founds();
    }

    function _gas_stop() internal {
        emit GasStop();
    }

    function _finalize_found_expose(uint cur) internal {
        Preset memory tr = presets_[cur];
        if (tr.to != address(0)) {  // for skipping
            (bool success, bytes memory data) = tr.to.call{value: tr.value}(bytes(tr.data));
            if (success) {
                emit TxDone(processing_, tr.to, tr.value, tr.data);
            } else {
                emit TxReverted(processing_, tr.to, tr.value, tr.data, _getRevertMsg(data));
            }
        } else {
            emit Skip(processing_);
        }
        _prepare_next_tx();
    }

    function _finalize_none_founds() internal {
        emit NoneMatches(processing_);
        _prepare_next_tx();
    }

    function _prepare_next_tx() internal {
        processing_ = NONE;
        presetCursor_ = 0;
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

    function resetCert(bytes32 cert) external {
        require(msg.sender == address(this), "internal only");
        cert_ = cert;
    }

    function setRGFProvider(IRGFProvider rgfProvider) external {
        require(msg.sender == address(this), "internal only");
        rgfProvider_ = rgfProvider;
    }
}