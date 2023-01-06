pragma solidity ^0.8.9;

import "./RNDM.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IStaking.sol";
import "./StringHandler.sol";
import "./RNDM.sol";

contract ForkCoin is Ownable {

    IERC20 _origin;
    RNDM _fork;
    constructor(IERC20 origin, ERC20 fork) {
        _origin = origin;
        _fork = new RNDM();
    }

    function exchange(uint amount) public {
        require(_origin.allowance(msg.sender, address(this)) >= amount);
        _origin.transferFrom(msg.sender, address(this), amount);
        _fork.mint(msg.sender, amount);
    }
}