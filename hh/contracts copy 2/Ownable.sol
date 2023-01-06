// pragma solidity ^0.8.9;

// import "./RNDM.sol";
// // Uncomment this line to use console.log
// import "hardhat/console.sol";
// // import "@openzeppelin/contracts/access/Ownable.sol";
// import "./IStaking.sol";
// import "./StringHandler.sol";
// import "./Mineable.sol";

// contract Ownable {

//     RNDM public coin;
//     IStaking public _staking;

//     uint lbn = 0; // last block number
//     bytes32 lbh; // last block hash
//     uint _random;
//     uint8 _difficulty = 2;

//     constructor() {
//         coin = new RNDM();
//         coin.mint(msg.sender, 1_000_000 ether);

//         lbn = block.number-1;
//         lbh = blockhash(block.number-2);
//     }

//     function burn(address account, uint amount) onlyOwner public {
//         coin.burn(account, amount);
//     }

//     function seed() public view returns(bytes32) {
//         bytes32 seed = sha256(abi.encodePacked(lbh, msg.sender));
//         // console.log('%o', toString(seed));
//         return seed;
//     }
    
//     function mine(uint256 random) public {
//         require(block.number!=lbn, "block already");
//         // 0.000027660974611725 ether,    0.033 usd
//         bytes32 seed = seed();
//         // 0.00000477952102 ether (added), 0.0056 usd
//         // total until here
//         // 0.000032440495631236 ether,    0.038 usd

//         // console.log('%o', toString(seed));
//         bytes memory byteProof = abi.encode(uint(seed)+random);
//         // 0.000000524677357 ether (added) 0.00062 usd
//         // 0.000032965172988322 ether,     0.039

//         bytes32 h = sha256(byteProof);
//         // 0.000001205093514 ether (added),  0.0014 usd
//         // 0.00003417026650226 ether,     0.040 usd

        
//         for (uint8 i = 0; i < _difficulty; i++) {
//             // for loop only 0.000003213200015 ether       0.0038 usd
//             // for loop only 0.000037383466517733 ether,   0.044 usd

//             // 0.000000120120262, 0.00014 usd (each)

//             // 0.000000526628364
//             // first: 0.000037488249041888
//             // second: 0.000038014877405648
//             // *third:  0.00003975249909888 
//             if (h[i] != 0) {
//                 revert("failed to set new random");
//             }
//         }
//         _random = random;
//         // 0.000040846688216438 ether   0.048 usd

//         lbn = block.number;
//         // 0.000047255132158311 ether   0.056 usd
//         lbh = blockhash(block.number-1);
//         // 0.000054825895375488 ether   0.065 usd
//         coin.mint(msg.sender, _reward);
//         // 0.000084224889317756 ether   0.099 usd
//         // coin.mint(msg.sender, halving.reward());
//         halving();
//         // 0.000093719506761634 ether   0.11 usd
//         // with require:
//         // 0.000093758413456078 ether   0.11 usd
//         // add 0.000000038906694 ether   0.000046 usd
//     }

//     function random(uint fromblock) public view returns(uint) {
//         require(fromblock<=lbn, "random is not available");
//         require(address(_staking) == address(0) || _staking.allowed(msg.sender), "not enough in staking");
//         return _random;
//     }
//     function setStaking(IStaking staking) onlyOwner public {
//         _staking = staking;
//     }
//     function setDifficulty(uint8 difficulty) onlyOwner public {
//         _difficulty = difficulty;
//     }
// }