pragma solidity ^0.8.9;

abstract contract IRandomizer {
    function random(uint fromblock) virtual public view returns(uint);
    function safe_random(uint fromblock) virtual public view returns(uint);
}