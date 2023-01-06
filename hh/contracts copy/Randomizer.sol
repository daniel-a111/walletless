pragma solidity ^0.8.9;

import "./RNDM.sol";
// Uncomment this line to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Staking.sol";

contract Randomizer {

    RNDM coin;
    uint lbn = 0; // last block number
    bytes32 lbh; // last block hash
    uint _random;
    uint _halving_counter;

    mapping(address=>uint) staking;

    uint8 _difficulty = 2;
    uint _reward = 1 ether;

    uint8 _halving_factor = 2;
    uint _min_stake = 10*1 ether;
    uint _halving = 50*1_000_000;

    address owner;

    Staking stake;
    constructor() {
        owner = msg.sender;
        coin = new RNDM();
        coin.mint(owner, 2**254-1);
        lbn = block.number-1;
        lbh = blockhash(block.number-2);
        stake = new Staking();
    }

    function halving() internal {
        _halving_counter++;
        if (_halving_counter == _halving) {
            _reward /= _halving_factor;
            _halving_counter = 0;
        }
    }

    function burn(address account, uint amount) public {
        require(msg.sender == owner);
        coin.burn(account, amount);
    }

    function seed() public view returns(bytes32) {
        bytes32 seed = sha256(abi.encodePacked(lbh, msg.sender));
        console.log('%o', toString(seed));
        return seed;
    }
    
    function generate(uint256 random) public {
        bytes32 seed = seed();
        console.log('%o', toString(seed));
        bytes memory byteProof = abi.encode(uint(seed)+random);
        bytes32 h = sha256(byteProof);
        for (uint8 i = 0; i < _difficulty; i++) {
            if (h[i] != 0) {
                revert("failed to set new random");
            }
        }
        _random = random;
        lbn = block.number;
        lbh = blockhash(block.number-1);
        coin.mint(msg.sender, _reward);
        halving();
    }

    function random(uint fromblock) public view returns(uint) {
        require(fromblock<=lbn, "random is not available");
        require(staking[msg.sender]>=_min_stake, "not enough in staking");
        return _random;
    }

    function stake(uint amount) public {
        uint allowance = coin.allowance(msg.sender, address(this));
        require(allowance>=amount, "no allowance");
        coin.transferFrom(msg.sender, address(this), amount);
        staking[msg.sender] += amount;
    }

    function unstake(uint amount) public {
        require(staking[msg.sender]>= amount, "not enough in staking");
        coin.transfer(msg.sender, amount);
        staking[msg.sender] -= amount;
    }

    function getCoin() public view returns(RNDM) {
        return coin;
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
    function setReward(uint reward) public {
        require(msg.sender == owner);
        _reward = reward;
    }
    function setDifficulty(uint8 difficulty) public {
        require(msg.sender == owner);
        _difficulty = difficulty;
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