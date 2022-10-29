pragma solidity ^0.8.9;

import "./IRGFProvider.sol";

contract ManualRGFProvider is IRGFProvider {

    uint public RGF;
    uint public RGFM;
    uint public MIN_RGF;
    address public owner;

    event ConfigurationChanged(uint RGF_, uint RGFM_, uint MIN_RGF_);

    constructor(address owner_, uint RGF_, uint RGFM_, uint MIN_RGF_) {
        owner = owner_;
        RGF = RGF_;
        RGFM = RGFM_;
        MIN_RGF = MIN_RGF_;
    }

    function set(uint RGF_, uint RGFM_, uint MIN_RGF_) public {
        require(msg.sender == owner, "owner only");
        emit ConfigurationChanged(RGF_, RGFM_, MIN_RGF_);
        RGF = RGF_;
        RGFM = RGFM_;
        MIN_RGF = MIN_RGF_;
    }

    function get(uint length) external view returns(uint256) {
        uint lengthAddition = length*50;
        uint byGasPrice = tx.gasprice*RGF*RGFM+lengthAddition;
        if (MIN_RGF+lengthAddition <= byGasPrice) {
            return byGasPrice;
        }
        return MIN_RGF+lengthAddition;
    }
}
