pragma solidity ^0.8.9;

import "./Walletless.sol";
import "./ManualRGFProvider.sol";

contract WalletlessDeployer {

    mapping (address => address) public walletlessToWallet;
    event newAccount(address account);
    function createAccount(address account, bytes32 cert, uint RGF, uint RGFM, uint MIN_RGF) public returns(address) {
        Walletless wallet = new Walletless();
        require(address(wallet) == account);
        ManualRGFProvider rgf = new ManualRGFProvider(account, RGF, RGFM, MIN_RGF);
        wallet.init(cert, rgf);
        emit newAccount(account);
        return account;
    }
}