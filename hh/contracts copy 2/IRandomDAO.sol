pragma solidity ^0.8.9;

import "./RNDM.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IStaking.sol";
import "./StringHandler.sol";
import "./Halvable.sol";
import "./IRandomizer.sol";

abstract contract IRandomDAO is IRandomizer {

    function burn(address account, uint amount) virtual public;

    function seed() public virtual view returns(bytes32);

    function mine(uint256 random) virtual public;

    function mine_and_difficulty_fit(uint256 random) virtual public;

    function coin() public virtual view returns(IERC20);
}