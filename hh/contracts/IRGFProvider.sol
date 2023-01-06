pragma solidity ^0.8.9;

interface IRGFProvider {
    function get(uint length, uint attackCounter) external view returns(uint256);
}
