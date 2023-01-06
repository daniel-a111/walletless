# Walletless Protocol

Walletless protocol consists of 3 layers:
1. Smart Contracts as accounts
1. Password Handler Standalone
1. Sign-Transactions service

## Smart Contract as Accounts

Walletless accounts are SCAAs (smart contracts as accounts) that act as proxies for transactions, and give users the platform to submit transactions over blockchain networks without the need of holding private keys. 

## SCAA Transactions vs. Native Transactions

Activation of a transaction produces an internal transaction by SCAA, which can be triggered by any other blockchain account using external transactions to SCAA interface.

 In this documentation we emphasise the difference between SCAA internal transactions and their trigerring transactions. We name SCAA internal transactions as "SCAA transactions", while all other transactions as "Native transactions".


## ECC vs SHA256

Unlike Elliptic Curve Cryptography, user-chosen passwords that are handled by hashing algorithms such as sha256, cannot provide authentication without exposing the actual used pre-images for sha256. This raises two main issues:

1. Nonreusability of passwords
1. Front-Running attacks

### Solving nonreusability of password

SCAA holds a certificate, which is an image of SHA256 produced by a particular password, and is used to authenticate the next single transaction using its pre-image. The pre-image for the following certificate then becomes the next certificate, and so on. This protocol allows individual passwords to be reused for a number of transactions. This number is defined by the user in password creation.

### Solving front-Running attacks

Each transaction consumes a certificate using its SHA256 pre-image. Still, due to [ECC vs SHA256], every certificate consumed must use certificate's pre-image before authentication proccessed. This raises the issue of Front-Running attacks, where an attacker may listen to network messages and hold pre-images before their images are consumed, thus able to quickly gain control over the transactions. 

Front-Running is the reason all SCAA transaction must be seperated into (at least) two native transactions: 

1. Preset Transaction Record, holds the desired transaction (within a copy of its message) alongside a certificate, a hash value of the transaction concatenated with the pre-image. 
2. Expose Proof, holds the pre-image itself. 

Walletless protocol makes SCAA transactions from the first Preset Transaction Record that is validated with the correct certificate that fits the pre-image.

## Interactions with SCAA interface

Interactions made by native transaction must be signed with any private keys that holds enough balance for gas fees. These private keys are thus able to sign transactions layers required for both sigining native transaction and gas fees credits. SCAA on the other hand, is not bundled or owned by any other account (including private keys) in order to keep the protocol decentralized. More precisely, the interaction can be made by the user itself, or by any third party. Moreover, a particular SCAA can have many interactors at once. For security (Phishing) purposes SCAA interactors are considered malicious, hence Walletless protocol ensures that no sensitive data is available to interactors.

# Protocol Layers

## 1. Smart Contracts
This is the blockchain layer, where the account exists and has the ability to hold assets and make transactions over blockchain networks. As smart contracts, Walletless accounts have their own address and can hold digital assets by default. Unlike most current Smart-Contracts, Walletless Smart-contracts are not bound or owned or by another blockchain account (such as owner, registered addresses, etc.). This "ownerless" smart-contract feature is an innovation of Walleless.


## 2. Password Handler Standalone

This layer is a frontend application where the user provides the real-password, thus producing the transaction (offline) that includes sha256 images corresponding to SCAA authentication protocol.

## 3. Sign-Transactions service

SCAAs are operated by Native Transactions, however, are unable to directly complete network fee payments. As a result, a separation between SCAA balance and its transactions fees is necessary. 

Sign-Transactions layer consists of centralized services that provide gas fees for Native Transactions that trigger the SCAA interface. It's the layer between Password Handler Standalone and SCAA. Note that the provider for this layer can be chosen by the user and can be replaced, without any limit on SCAA accessibility.
