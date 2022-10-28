pragma solidity ^0.8.9;

import "./WalletLess.sol";

contract WalletLessDeployer {

    function createAccount() public returns(address) {
        return address(new WalletLess());
    }
}