pragma solidity ^0.8.9;

import "./RNDM.sol";
// Uncomment this line to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract IStaking {
    function allowed(address account) virtual public view returns(bool);
}