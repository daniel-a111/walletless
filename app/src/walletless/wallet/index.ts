import sha256 from 'crypto-js/sha256';
import * as types from "../types";
import * as crypto from '../crypto'
import * as network from '../network'
import * as backend from '../gas/provider'
import * as gasProvider from '../gas/provider'
import * as pipeline from '../pipeline'

export async function authenticate(address: string,
    password: string, difficulty: number): Promise<boolean> 
{
    let account: types.Account = await network.account(address);
    if (account.cert) {
        return crypto.authPreImageChain(`${address}${password}`, account.cert, difficulty);
    }
    return false;
}

export async function createGasFeeProvider(): Promise<types.GasFeesProvider> {
    const {address, key, balance} = await backend.createGasFeeProvider();
    return {address, key, balance};
}

export async function getGasFeesProvider(address: string, viewCert: string): Promise<types.GasFeesProvider|undefined> {
    const {address: providerAddress, balance} = await backend.getFeesAccount(address, viewCert);
    return {address: providerAddress, balance};    
}

export async function deploySCAA(feesAddress: string, key: string): Promise<string> {
    await backend.signup(feesAddress, key);
    return "";
}

export async function initSCAA(address: string, password: string,
    difficulty: number, feesAddress: string, key: string): Promise<types.Account> {
    let cert = crypto.preImageChain(`${address}${password}`, difficulty);
    await backend.init(address, cert, feesAddress, key);
    return {}
}

export async function transact(tx: types.TxAuthentication): Promise<string> {
    try {
        let account: types.AccountState = await network.accountState(tx.transaction.from);
        if (account.txProcessing) {
            throw "Transaction processing";
        }
        if (account.cert) {
            let certAccess = crypto.preImageAccess(tx.transaction.from, tx.password, account.cert, tx.difficulty);
            if (certAccess) {
                let txHash = await gasProvider.transactPreset({
                    transaction: tx.transaction,
                    cert: certAccess.cert,
                }, certAccess.proofProof);
                
                const scaaTx = new pipeline.TransactionSCAA(txHash, certAccess.proof);
                scaaTx.start();
                
                return txHash
            }
        }
    } catch{} 
    return "";
}



