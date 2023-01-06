
# Password Handler Standalone

Walletless Password Handler Standalone is an offline browser application that is provided by IPFS as a static HTML file, that runs on modern internet browsers. This application can be alternatively used by other trusted providers.

This is a standalone application that separates the passwords from the network layer, i.e. hides users' sensitive data (aka passwords) from the network. The application then posts the data online in non-reused formats.

## Interface

Below are the interface functions, followed by the relevant internal funcions.

``` createAccount(password) ```

Creates new account with ```password``` as user-password (or account's key). This password is then the only data required of the user in order to make transactions.

----

``` submit(from, password, to, value, data) ```

Submit transaction on blockchain: send transaction with ```value``` wei units from account address ```from``` to account address ```to```, with data ```data``` in case ```to``` is a smart contract. ```password``` is use for authentication as the user-chosen (or key) of ```from```.

-----

``` resumeExpose(account) ```

This method use for extreme cases, as described on (gas costs exhaustion) ...... An execution of it resumes "transaction in process" mode for account address ```account```.

-----

``` recoverPassword(account, knownPasswordPart) ```

Partial forgotten password recovery by Offline-Guessing. For example, a user created account with address ```a``` and "My3Greate!Password945" as its key. The user may then recover its password using ``` recoverPassword(a, "My Great Password") ```.

-----

## Internal functionallity

``` genCert(account, password) ```

``` genProof(account, password) ```

``` genPresetRecord(account, password) ```


## Implementations


### Create Account

1. Deploy new account as smart contract
2. Generate hashed certificate from account's address and user-chosen password
3. Store hashed certificate within smart contract's storage 

Any text can be used as a password. Regarding Guessing attacks, passwords can be limited for strength by adding logics to offline application (only), as these kinds of limits cannot be implemented on-chain.

Users can consider the strategy of picking Peta/Tera/Giba/Mega bytes sized password such as the contents of a book, in order to make it difficult for "guessing", by slowing down guesses that rely on large and time-consuming downloads over the network.


Another strategy that can be use to counter guessing attacks, is picking high value nonces that can affects the time consumed for each guess, as described below [Generate Certificate].


```javascript
function createAccount(password, nonces) {
    let address = deployAccount();           // deploy new account
    let cert = genCert(address, password, nonces);   // Generate hashed certificate
    initAccount(address, cert);              // set new account and activate
}
```

---

### Transact

1. Generate & submit preset record
2. Wait for preset record confirmations
3. Generate proof & submit

There are no limits on what kind of transaction can be made through Walletless accounts (excluding deprecated uses of tx.origin).

Unlike private keys, user-chosen passwords cannot provide a proof for authentication without exposing the actual proof, that may then be used by attackers listening to network. Hence, all transactions made from the account must be seperated into two native transactions: one that holds the content data with a certificate for the proof, and another that holds the proof only. This protocol designates the first to hold the proof as the actual decision maker for the transaction.


Walletless accounts can submit transactions in the exact same format that ordinary blockchain accounts do. Note that smart contracts can act differently for private keys and Walletless account when tx.origin is involved.

Walletless accounts have transaction-based authentications, hence same format is used here with the exception of replacing the private key with account's address + user-chosen password.


```javascript
function transact(address, password, to, value, data) {
    let {tx, cert} = genPresetRecord(address, password, to, value, data);
    submit(tx, cert);
    await waitForConcesusAccept(tx, cert);
    let proof = genProof(address, password);
    expose(proof);
}
```
---

### Generate Certificate

1. Caclulate the $\text{sha256}^{\text{nonceCount}}(\text{password, nonces})$

As mentioned above in [Create Account], the nonces parameter can control the difficulty of performing Guessing Attacks. For example, use of nonceCount = 10,000,000 can force a guessing duration of 15 sec (for today).

In this case, fast access can be made possible by using additional logics in order to store a temporary copy of an intermediate image.

```javascript
function genCert(address, password, nonceCount) {
    let cert = sha256(address+password);
    for (let i = 0; i < nonceCount; i++) {
        cert = sha256(cert);
    }
    return cert;
}
```
---
### Generate Proof
1. Looking for an integer $i$ such that 
$\text{sha256}^{i+1}(\text{password}) = \text{cert}$

Note that fast access is possible here, as mentioned in [Generate Certificate].

```javascript
function genProof(address, password, maxNonceCount) {
    let proof = getCurrentCert(address);
    for (let i = 0; i < maxNonceCount; i++) {
        if (sha256(proof) === cert) {
            return proof;
        }
        proof = sha256(proof);
    }
    return null;
}
```

---
### Generate Preset Record
1. Generate proof from password
2. Calculate sha256 for the concatenation of transaction message as a text and proof

Preset Record is a record that wraps a native transaction with a certificate for proof, allowing it to be easily validated by network nodes by using sha256.

```javascript
function genPresetRecord(address, password, to, value, data) {
    let proof = genProof(addres, password);
    let cert = sha256(to+value+data+proof);
    return cert;
}
```
---
### Generate native transaction to blockchain networks

Here we show technical details regarding integrations with blockchain nodes. Note that ```OnlineService.submit``` is a server (backend) application that is neccessary for submitting native transactions involving gas fees. Note that ```OnlineService``` can be configured to any other decentralization provider. For example, MetaMask browser extension can be used as ```OnlineService```.

#### Deploy Account
```javascript
function deployAccount(address, tx, cert) {
    let contractInterface = loadContractInterface(address);
    let tx = contractInterface.deploy();
    return OnlineService.submit(tx);
}
```

#### Transact
```javascript
function submit(address, tx, cert) {
    let contractInterface = loadContractInterface(address);
    let tx = contractInterface.methods.preset(tx, cert);
    return OnlineService.submit(tx);
}
```

#### Expose proof
```javascript
function expose(address, proof) {
    let contractInterface = loadContractInterface(address);
    let tx = contractInterface.methods.expose(proof);
    return OnlineService.submit(tx);
}
```
