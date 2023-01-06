

# Sign-Transactions service


This service is an implementation for Sign-Transactions service layer, on Walletless protocol. This service is pretty stright forward and centralized, that is map between SCAA addresses and their gas fee credit holder account. 

This service exposes details about gas fees credit balances and, sign & submit native transactions only. As mentioned on [Wallet protocol section], this services are neccassary for sign transactions, that must done by holding PK. Regarding Walletless protocol and Sign-Transactions-Layer, holding of PK is not sensitive, because their accounts hold small amount of value, that is used for gas-fees payments only.


## API Interface

``` getGasFeesAccount(account) ```

Get SCAA account address ```account``` and returns the address of its gas fees credit holder, and its credit balance.

``` submit(tx) ```

Signs and sends native transaction ```tx```.

``` topupGasFeesCredit(paymentMethod, order) ```

Topup gas fees account with balance, that is uses for gas fee costs only.
