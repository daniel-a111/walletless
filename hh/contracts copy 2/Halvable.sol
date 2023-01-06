pragma solidity ^0.8.9;

import "./RNDM.sol";
// Uncomment this line to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IStaking.sol";
import "./StringHandler.sol";


contract Halvable is Ownable, StringHandler {
    uint8 constant FACTOR = 2;

    uint _halving_counter;
    uint _halving_every = 10_500_000;
    uint _reward = 1 ether;

    function halving() internal {
        _halving_counter++;
        if (_halving_counter == _halving_every) {
            _reward /= FACTOR;
            _halving_counter = 0;
        }
    }
    
    function reward() public view returns(uint) {
        return _reward;
    }

    function next_halving_in() public view returns(uint) {
        return _halving_every - _halving_counter;
    }

    function reward_after_next_halving() public view returns(uint) {
        return _reward / FACTOR;
    }
}