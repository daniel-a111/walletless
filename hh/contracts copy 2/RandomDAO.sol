pragma solidity ^0.8.9;

import "./RNDM.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IStaking.sol";
import "./StringHandler.sol";
import "./Halvable.sol";
import "./IRandomizer.sol";
import "./IRandomDAO.sol";

contract RandomDAO is Ownable, Halvable, IRandomizer, IRandomDAO {

    RNDM public _coin;
    IStaking public _staking;

    uint _random;
    uint _block_number = 0; // last block number
    bytes32 _block_hash; // last block hash

    bytes32 _previous_block_hash;
    uint8 _padding_zeros = 4;

    IRandomizer _fork;

    bool burn_enabled = true;

    constructor() {
        _coin = new RNDM();
        _coin.mint(msg.sender, 1_000_000 ether);

        _block_number = block.number-1;
        _block_hash = blockhash(block.number-2);
    }

    function burn(address account, uint amount) onlyOwner override public {
        require(burn_enabled, "burn disabled");
        _coin.burn(account, amount);
    }

    function disable_burn() onlyOwner public {
        burn_enabled = false;
    }

    function seed() public override view returns(bytes32) {
        return _seed(_block_hash);
    }
    
    function previous_seed() public view returns(bytes32) {
        return _seed(_previous_block_hash);
    }

    function _seed(bytes32 bh) internal view returns(bytes32) {
        return sha256(abi.encodePacked(bh, msg.sender));
    }
    
    function mine(uint256 random) override public {
        require(block.number != _block_number, "block already");
        require(_validate_mine(seed(), random), "random is not valid");
        _random = random;
        _previous_block_hash = _block_hash;
        _block_number = block.number;
        _block_hash = blockhash(block.number-1);
        _coin.mint(msg.sender, _reward);
        halving();
    }

    function mine_and_difficulty_fit(uint256 random) override public {
        if (block.number == _block_number) {
            require(_validate_mine(previous_seed(), random), "random is not valid");
            _padding_zeros++;
        } else {
            uint last_block_number = _block_number;
            mine(random);
            if (block.number > last_block_number+1 && _padding_zeros > 0) {
                _padding_zeros--;
            }
        }
    }

    function _validate_mine(bytes32 seed, uint256 random) internal view returns(bool) {
        bytes memory byteProof = abi.encode(uint(seed)+random);
        bytes32 h = sha256(byteProof);
        return _validate_padding_zeros(h, _padding_zeros);
    }

    function _validate_padding_zeros(bytes32 h, uint8 count) internal view returns(bool) {
        uint8 m = count % 2; 
        uint8 f = (count-m)/2;
        for ( uint8 i = 0; i < f; i++ ) {
            if (h[i] != 0) {
                return false;
            }
        }
        if (m==1) {
            if (uint8(h[f]) >= 16) {
                return false;
            }
        }
        return true;
    }

    function random(uint fromblock) override public view returns(uint) {
        require(fromblock <= _block_number, "random is not available");
        require(address(_staking) == address(0) || _staking.allowed(msg.sender), "not allowed");
        return _random;
    }

    function safe_random(uint fromblock) override public view returns(uint) {
        if (address(_fork) == address(0)) {
            return random(fromblock);
        } else {
            return fork_random(fromblock);
        }
    }

    function fork_random(uint fromblock) public view returns(uint) {
        return _fork.safe_random(fromblock);
    }

    function set_staking(IStaking staking) onlyOwner public {
        _staking = staking;
    }

    function set_fork(IRandomizer fork) onlyOwner public {
        _fork = fork;
    }
    
    function padding_zeros() public view returns(uint8) {
        return _padding_zeros;
    }

    function coin() override public view returns(IERC20) {
        return _coin;
    }
}