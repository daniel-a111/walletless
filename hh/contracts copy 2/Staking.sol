pragma solidity ^0.8.9;

import "./RNDM.sol";
import "./IStaking.sol";
// Uncomment this line to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Ownable, IStaking {

    RNDM _coin;
    mapping(address=>mapping(address=>uint)) staking_owners;
    mapping(address=>uint) staking;
    uint _min_stake = 10*1 ether;

    constructor(RNDM coin) {
        _coin = coin;
    }

    function stake(address account, uint amount) public {
        uint allowance = _coin.allowance(msg.sender, address(this));
        require(allowance>=amount, "no allowance");
        _coin.transferFrom(msg.sender, address(this), amount);
        staking[msg.sender] += amount;
        staking_owners[msg.sender][account] += amount;
    }

    function unstake(address account, uint amount) public {
        require(staking[msg.sender]>= amount, "not enough in staking");
        require(staking_owners[msg.sender][account]>= amount, "not enough in staking for targeted account");
        _coin.transfer(msg.sender, amount);
        staking[msg.sender] -= amount;
        staking_owners[msg.sender][account] -= amount;
    }

    function coin() public view returns(RNDM) {
        return _coin;
    }

    function allowed(address account) public view override returns(bool) {
        return staking[account] >= _min_stake;
    }

    function set_min_stake(uint min_stake) onlyOwner public {
        _min_stake = min_stake;
    }
}