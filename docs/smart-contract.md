

# Walletless SCAA

SCAA is Smart Contract as A Service, currently avaialbe for EVM ecosystem, and can be implemented on top of most Blockchain networks that support smart contracts. 

In Walletless protocol each account is a particular SCAA, i.e. smart contract account, with unique address, hence every registration of SCAA must followed by contract deployment, and authentication initializing.

SCAA transaction made by Two-Steps-Authentication, using native ```call``` function, that is invoke internal (SCAA) transaction.

## Storage Variables

This section provides technical details in terms of security, especialy Guessing / Brute Force attacks.


We describe the storage of SCAA, that is public and can be used by guessing attackers, as follow:

1. Nonce Certificate, an image of SHA256 that is using for authentication for the next single transaction, or for cancellation. Note that this value is replaced every pre-image expose, in order to achieve password reusabillity.
1. List of registered Preset Record, which include SCAA transaction data and a Preset Record certificate, Preset Certificate.

Note that on attempt to invoke SCAA transaction, same proof uses to validate Nonce Certificate and Preset Certificate.

---

Data that is not stored within SCAA:
1. The Password or any other pre-image of Nonce Certificate.
2. Hash Difficulty, the number of SHA256 activations, that can be use as indicator for "success guessing attack". Note that its absent is usefull, because it make attacker lack of certainty about his attempts.

---

The main storage data elements, as follow:

``` bytes32 cert ```

Holds an image of SHA256 that produced recursively by a particular password (ordinary text). It replaced by its SHA256 pre-image each authentication, where authentication made each SCAA transaction or none. It uses for authentication once its pre-image ```proof``` is provided by the condition ``` sha256(proof) == cert ```. If authentication succeed then SCAA set ``` cert = proof ```, i.e. updates its cert with its pre-image for further authentications.

``` mapping(uint8 => PresetRecord) presetRecords ```

This mapping holds PresetRecord sturcture, that holds the next desired SCAA transaction with another certificate. This data can be used by the user to make sure that ```proof``` exposition is safe.

** Note that PresetRecord described fully next section [Storage Structures].



### Storage structures

```
struct PresetRecord {
    Tx tx;
    byte32 cert;
} 
```

``` 
struct Tx {
    address to;
    uint value;
    bytes data;
} 
```

### Additional Storage Data
Additionally helpful storage is used on proof exposition processing, ```expose``` (this is describe later on), it includes:

``` boolean isExposeProcessing ```

Indicates for expose process. SCAA in isExposeProcessing cannot register new Preset Transactions or use expose method with another proof.

``` uint8 nextPendingPresetRecord```

Indicates for the exposing proof intermiddiate process state.




## Interface
Below are the interface functions, followed by the relevant internal funcions.

``` initAuth(bytes32 cert) ```

Initialize new account by password. ```cert``` is the first Nonce Certificate, that held within the smart contract storage. Note that regarding gas fees protection, this method can be invoked only by the same account that had deployed it.

---

``` preset(Tx tx, bytes32 txCert) ```

This endpoint is the first step, among two, that produces SCAA transaction. This endpoint stores Preset Record Registration on contract's storage. It gets a copy of the next desired transaction ```tx``` to be executed, and ```txCert``` as a SHA256 image that include tx (as a text), and the current pre-image for ```cert```. 

Note that regarding Gas-Fees-Exhausting attack this method costs RGF payment.

---

``` expose(bytes32 proof) ```

User expose proof (pre-image for ```cert```) ```expose``` endpoint the the second step to SCAA transaction invoke. This method invoke an internal process that search for the first Preset Certificate, by registeration time, with ```proof``` as its proof. 

Note that in all cases ```proof``` became the next ```cert```, as an outcome of ```expose```. In case where no mutual Preset Record exists, then no SCAA transaction made, but its nonce increases. This can for cancelling in-process Preset Records.

---

``` resumeExpose(bytes32 proof) ```

Helping method for ```expose``` that can be used for resuming ```expose``` processes, in case it stopped in intermiddiate process, that stops caused by wrong gas fees management.


## Implementations
Implementation of SCAA interfaces methods and their internal logics.

``` 
function initAuth(bytes32 cert_) {
    require(cert == '0x0000...00000');
    cert = cert_;
}
```

```
function preset(Tx tx, bytes32 cert) {
    rgfValidation();
    registerPresetRecord(tx, cert);
}
```

```
function expose(byte32 proof) {
    auth(proof);
    cert = proof;  // update next cert
    executeFirstRecordedPresetIfExists();
}
```

```
function resumeExpose() {
    require(isExposeProcessing);
    executeFirstRecordedPresetIfExists_resume();
}
```

```
function auth(bytes32 proof) {
    if (sha256(proof) == cert) {
        cert = proof;
    } else {
        revert("Wrong proof");
    }
}
```

```
function authTransaction(Tx tx, bytes32 proof) {
    return sha256(tx.to+tx.value+tx.data+proof) == tx.cert;
}
```
