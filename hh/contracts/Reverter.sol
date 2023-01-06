pragma solidity ^0.8.9;

contract Reverter {

    function ok() public {
        revert("Reverter Default");
    }
}