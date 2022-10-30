pragma solidity ^0.8.9;

import "./WalletLess.sol";

contract WalletLessDeployer {

    event newAccount(address account);
    function createAccount() public returns(address) {
        WalletLess account = new WalletLess();
        emit newAccount(address(account));
        return address(account);
    }
}