pragma solidity ^0.8.9;

import "./RNDM.sol";
import "./IRandomDAO.sol";
// Uncomment this line to use console.log
import "hardhat/console.sol";

library consts {
    uint8 constant TRANSFER_OWNERSHIP = 1;
    uint8 constant SET_HALVING = 2;
    uint8 constant SET_HALVING_FACTOR = 3;
    uint8 constant SET_MIN_STAKE = 4;
    uint8 constant SET_REWARD = 5;
    uint8 constant SET_DIFFICULTY = 6;
}

struct Suggestion {
    uint8 action;
    bytes data;
    uint block_reg;
}

contract StakeNFT {
    
}

contract Gov {

    RNDM _coin;
    IRandomDAO _randomizer;
    mapping(address=>uint) balances;
    mapping(address=>uint) staking;
    uint suggestId;
    mapping(uint=>Suggestion) suggestions;

    mapping(address=>mapping(uint=>bool)) votes_by_nft;
    mapping(uint=>bool) votes;
    mapping(address=>uint32) nfts_activations;

    constructor(RNDM coin, IRandomDAO randomizer) {
        _coin = coin;
        _randomizer = randomizer;
    }

    function suggest(uint8 action, bytes calldata data) public {
        uint id = suggestId++;
        suggestions[id] = Suggestion({ action: action, data: data, block_reg: block.number });
    }

    function stake(uint amount) public {
        balances[msg.sender] += amount;
        staking[msg.sender] += amount;
    }

    function unstake(uint amount) public {
        balances[msg.sender] -= amount;
        staking[msg.sender] -= amount;
    }

    function stakeFor(address account, uint amount) public {
        staking[msg.sender] -= amount;
        staking[account] += amount;
    }

    function unstakeFor(address account, uint amount, uint until) public {
        staking[msg.sender] += amount;
        staking[account] -= amount;
    }

}