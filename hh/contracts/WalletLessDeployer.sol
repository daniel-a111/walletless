pragma solidity ^0.8.9;

import "./Walletless.sol";
import "./ManualRGFProvider.sol";



contract WalletlessDeployer {


    mapping (Walletless => address) public initializers_;


    event ScaaCreated(Walletless account, address initializer);


    function createAccount() public returns(Walletless) {
        Walletless wallet = new Walletless();
        emit ScaaCreated(wallet, msg.sender);
        initializers_[wallet] = msg.sender;
        return wallet;
    }


    function initAccount(Walletless wallet, bytes32 cert) public {
        require(msg.sender == initializers_[wallet], "wrong wallet");
        wallet.init(cert, _rgf());
    }


    function createAccountAndInit(Walletless account, bytes32 cert) public returns(Walletless) {
        Walletless wallet = new Walletless();
        wallet.init(cert, _rgf());
        require(wallet == account, "address validation failed");
        emit ScaaCreated(account, address(0));
        return account;
    }


    function deployFor(address payable[] calldata initializers, address firstSCAA) external payable {
        uint length = initializers.length;
        require(length*4 ether <= msg.value);
        for (uint i = 0; i < length; i++) {
            address payable next = initializers[i];
            Walletless wallet = new Walletless();
            if (i == 0) {
                require(firstSCAA==address(wallet), "First SCAA validation failed");
            }
            emit ScaaCreated(wallet, next);
            initializers_[wallet] = next;
            next.transfer(2 ether);
            payable(address(wallet)).transfer(2 ether);  // TODO Remove after development
        }
    }


    function _rgf() internal returns(ManualRGFProvider) {
        return new ManualRGFProvider(msg.sender, 0.001 ether, 0.0000001 ether);
    }
}