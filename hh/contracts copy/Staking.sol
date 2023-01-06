pragma solidity ^0.8.9;

import "./RNDM.sol";
// Uncomment this line to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking {

    RNDM _coin;
    uint _halving_counter;
    mapping(address=>uint) staking;
    uint8 _halving_factor = 2;
    uint _min_stake = 10*1 ether;
    uint _halving = 50*1_000_000;

    address owner;

    constructor(RNDM coin) {
        _coin = coin;
        owner = msg.sender;
    }

    function stake(uint amount) public {
        uint allowance = _coin.allowance(msg.sender, address(this));
        require(allowance>=amount, "no allowance");
        _coin.transferFrom(msg.sender, address(this), amount);
        staking[msg.sender] += amount;
    }

    function unstake(uint amount) public {
        require(staking[msg.sender]>= amount, "not enough in staking");
        _coin.transfer(msg.sender, amount);
        staking[msg.sender] -= amount;
    }

    function getCoin() public view returns(RNDM) {
        return _coin;
    }






    function transferOwnership(address nextOwner) public {
        require(msg.sender == owner);
        owner = nextOwner;
    }
    function setHalving(uint halving) public {
        require(msg.sender == owner);
        _halving = halving;
    }
    function setHalvingFactor(uint8 halving_factor) public {
        require(msg.sender == owner);
        _halving_factor = halving_factor;
    }
    function setMinStake(uint min_stake) public {
        require(msg.sender == owner);
        _min_stake = min_stake;
    }
    
    function toString(bytes32 data) public pure returns(string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }

    function toString(bytes memory data) public pure returns(string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
}