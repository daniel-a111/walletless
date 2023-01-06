pragma solidity ^0.8.9;

import "./WalletLess.sol";
import "./ManualRGFProvider.sol";

contract WalletLessDeployer {

    mapping (address => address) public walletlessToWallet;
    event newAccount(address account);
    function createAccount() public returns(address) {
        WalletLess account = new WalletLess();
        address newAccountAddress = address(account);
        emit newAccount(newAccountAddress);
        walletlessToWallet[newAccountAddress] = msg.sender;
        return newAccountAddress;
    }

    function initAcount(address account, bytes32 cert, uint RGF, uint RGFM, uint MIN_RGF) public {
        require(msg.sender == walletlessToWallet[account], "wrong wallet");
        WalletLess walletless = WalletLess(account);
        ManualRGFProvider rgf = new ManualRGFProvider(account, RGF, RGFM, MIN_RGF);
        walletless.init(cert, rgf);
    }
}