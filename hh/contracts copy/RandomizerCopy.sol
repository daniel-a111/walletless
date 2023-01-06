pragma solidity ^0.8.9;

import "./RNDM.sol";
// Uncomment this line to use console.log
import "hardhat/console.sol";

contract RandomizerCopy {

    RNDM coin;
    uint lastBlock = 0;
    uint _random = 0;
    mapping(address=>uint) staking;
    mapping(address=>bool) consumer;
    mapping(address=>uint) min_for;

    address owner;
    uint _min_stake = 10*1 ether;
    uint _halving = 50*1_000_000;
    uint _reward = 1 ether;
    bool using_halving = true;

    uint next_halving;

    constructor() {
        owner = msg.sender;
        coin = new RNDM();
        coin.mint(owner, 3_000_000 ether);
        lastBlock = block.number-1;
        next_halving = _halving;
    }
    function halving() internal {
        if (using_halving) {
            next_halving--;
            if (next_halving == 0) {
                _reward /= 2;
                next_halving = _halving;
            }
        }
    }
    function transferOwnership(address nextOwner) public {
        require(msg.sender == owner);
        owner = nextOwner;
    }
    function setHalving(uint halving) public {
        require(msg.sender == owner);
        _halving = halving;
    }
    function setMinStake(uint min_stake) public {
        require(msg.sender == owner);
        _min_stake = min_stake;
    }
    function setReward(uint reward) public {
        require(msg.sender == owner);
        _reward = reward;
    }
    function seed() public view returns(bytes32) {
        return blockhash(lastBlock);
    }
    function genRandom(uint256 random) public {
        bytes32 bh = blockhash(lastBlock);
        bytes32 seed = sha256(abi.encodePacked(bh, msg.sender));
        bytes memory byteProof = abi.encode(uint(seed)+random);
        bytes32 h = sha256(byteProof);
        console.log('%o', toString(h));
        for (uint8 i = 0; i < 2; i++) {
            if (h[i] != 0) {
                revert("failed to set new random");
            }
        }
        _random = random;
        lastBlock = block.number;
        coin.mint(msg.sender, _reward);
        halving();
    }

    function random(uint afterBlock) public view returns(uint) {
        require(afterBlock<lastBlock, "Random is not available");
        require(consumer[msg.sender], "No staking");
        console.log('%o>=%o', afterBlock,lastBlock);
        return _random;
    }

    function stake(uint amount) public {
        uint allowance = coin.allowance(msg.sender, address(this));
        require(allowance>=amount);
        coin.transferFrom(msg.sender, address(this), amount);
        staking[msg.sender] += amount;
        if (!consumer[msg.sender] && staking[msg.sender]>=_min_stake) {
            min_for[msg.sender] = _min_stake;
        }
        if (staking[msg.sender]>=_min_stake) {
            consumer[msg.sender] = true;
        }
    }

    function unstake(uint amount) public {
        require(staking[msg.sender]>= amount, "not enough in staking");
        coin.transfer(msg.sender, amount);
        staking[msg.sender] -= amount;
        consumer[msg.sender] = staking[msg.sender]>=min_for[msg.sender];
    }

    function getCoin() public view returns(RNDM) {
        return coin;
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