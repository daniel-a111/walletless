pragma solidity ^0.8.9;

import "./IRGFProvider.sol";

contract ManualRGFProvider is IRGFProvider {

    uint public RGF;
    uint public DATA_FEES;
    // uint public RGFM;
    // uint public MIN_RGF;
    address public owner;

    event ConfigurationChanged(uint RGF_, uint DATA_FEES);

    constructor(address owner_, uint RGF_, uint DATA_FEES_) {
        owner = owner_;
        RGF = RGF_;
        DATA_FEES = DATA_FEES_;
    }

    function set(uint RGF_, uint DATA_FEES_) public {
        require(msg.sender == owner, "owner only");
        emit ConfigurationChanged(RGF_, DATA_FEES_);
        RGF = RGF_;
        DATA_FEES = DATA_FEES_;
    }

    function get(uint length, uint presetCounter) external view returns(uint256) {
        uint lengthAdditionGas = length*50;
        uint attackCounter = (presetCounter-presetCounter%10)/10;
        return RGF*(2**attackCounter)+lengthAdditionGas*DATA_FEES;
    }
}
