import * as types from "./types";
import * as crypto from './crypto'
import * as network from './network'
import * as provider from './gas/provider'
import * as gasProvider from './gas/provider'
import * as pipeline from './pipeline'
import { Tx } from "./network/types";
import * as backend from "../backend";
import { sha256 } from "ethers/lib/utils";
import { ethers } from "ethers";
import { stat } from "fs";

export * as crypto from './crypto';
export * as provider from './gas/provider'
export * as types from "./types";
export * as abis from "./abis";

export const NULL_CERT = '0x0000000000000000000000000000000000000000000000000000000000000000';
export interface Coin {
    address?: string;
    symbol: string;
    name: string;
    decimals: number;
}

export interface Balance {
    coin: Coin;
    balance: string;
}

export interface Account {
    address: string;
    balances: Balance[];
}

export interface SCAA {
    address: string;
    balance: string;
    cert: string;
    feesAccount: string;
    isActive: boolean;
    nonce: number;
    pendingAttackCounter: number;
    pendingCounter: number;
    processingCursor: number;
    rgfProvider: string;
    txProcessing: boolean;
}

export interface WalletlessState {
    gasProvider?: types.GasFeesProvider;
    deploy?: Tx;
    address?: string;
    init?: Tx;
    account?: SCAA;
}

export interface PipelineState {
    deploy: pipeline.DeploySCAA;
}

export abstract class AbsFreezeProvider {
    abstract get(): WalletlessState;
    abstract set(state: WalletlessState): void;
}

export const login = async (address: string, pass: string, difficulty: number, difficultyUnit: number) => {
    console.log({
        account: address, pass, difficulty, difficultyUnit
    });
    let scaa: SCAA = await backend.getAccountState(address);
    let it = difficultyTimeToIterations(difficulty, difficultyUnit);
    console.log({it});
    let access = crypto.preImageAccess(address, pass, scaa.cert, it);
    console.log({access});
    let {account, gasProvider} = await provider.passwordLogin(address, access?.proofProof||'');
    console.log({account});

    state.deploy = undefined;
    state.init = undefined;
    state.address = undefined;
    state.account = account;
    state.gasProvider = gasProvider;
    freeze();
    
    // console.log(it);
    // console.log(account+pass, wallet?.account?.cert||'', it);

}

const onDeployDone = (account: SCAA) => {
    state.account = account;
    freeze();
}

const onInitDone = () => {
    if (state?.init) {
        state.init.status = 'done';
        freeze();
    }
}
let state: WalletlessState = {};
let _freeze: AbsFreezeProvider;
let deploy: pipeline.DeploySCAA|undefined;
let initTx: pipeline.InitSCAA|undefined;
export async function init(freezeProvider?: AbsFreezeProvider) {
    if (freezeProvider) {
        _freeze = freezeProvider;
        state = freezeProvider.get();    
    }
    if (!state.gasProvider) {
        createGasFeeProvider();
    }

    async function update() {
        await getGasFeesProvider();
        if (state.account) {
            let account = await backend.getAccountState(state.account.address);
            if (account) {
                state.account = account;
                freeze();
            }
        }
        // setTimeout(() => {
        //     update();
        // }, 10000);
    }
    update();

    if (state?.deploy?.status === 'pending') {
        deploy = new pipeline.DeploySCAA(state.deploy);
        deploy.start(onDeployDone);
    }

    if (state?.init && (state?.init?.status === 'pending' || !state?.init?.status)) {
        initTx = new pipeline.InitSCAA(state.init);
        initTx.start(onInitDone);
    }

    if ( state.address && !state.account ) {
        state.account = await backend.getAccountState(state.address);
        freeze();
    }

    if (state.account) {
        
    }
}

const loginSCAA = (address: string, key: string) => {

}

function freeze() {
    _freeze.set(state);
}

export function getState() {
    return state;
}

export function getDeploy(): pipeline.DeploySCAA|undefined {
    return deploy;
}

export function getInit(): pipeline.InitSCAA|undefined {
    return initTx;
}

export async function authenticate(address: string,
    password: string, difficulty: number): Promise<boolean> 
{
    let account: types.Account = await network.account(address);
    if (account.cert) {
        return crypto.authPreImageChain(`${address}${password}`, account.cert, difficulty);
    }
    return false;
}

async function createGasFeeProvider(): Promise<types.GasFeesProvider> {
    let {gasProvider, account} = await provider.createGasFeeProvider();
    state.gasProvider = gasProvider;
    if (state.gasProvider) {
        if (!state.account) {
            state.account = account;
        }
        freeze();
        return state.gasProvider;
    }
    throw 'error while creating gas provider';
}

export async function getGasFeesProvider(): Promise<types.GasFeesProvider> {
    if (state.gasProvider) {
        let {gasProvider, account} = await provider.getFeesAccount( state.gasProvider.address, state.gasProvider.key);
        if (gasProvider) {
            if (!state.account) {
                state.account = account;
            }
            state.gasProvider = gasProvider;
            freeze();
        }
        return gasProvider;
    }
    throw 'error while creating gas provider';    
}


export async function deploySCAA(): Promise<pipeline.DeploySCAA> {
    if (state.gasProvider) {
        state.deploy = await provider.signup(state.gasProvider.address, state.gasProvider.key||'');
        deploy = new pipeline.DeploySCAA(state.deploy);
        deploy.start(onDeployDone);
        freeze();
        return deploy;
    }
    throw 'provider does not exists';
}


const DIF_PER_SECOND = 10_000_000/15;

export function difficultyTimeToIterations(difficulty: number, difficultyUnit:number) {
    return Math.floor(difficulty*difficultyUnit/1000*DIF_PER_SECOND);
} 

export async function initSCAA(address: string, password: string,
    difficulty: number, difficultyUnit:number, feesAddress: string, key: string): Promise<pipeline.InitSCAA> {
    if (state.gasProvider) {
        difficulty = difficultyTimeToIterations(difficulty, difficultyUnit);
        let cert = crypto.preImageChain(address+password, difficulty);
        state.init = await provider.init(address, cert, feesAddress, key);

        let initTx = new pipeline.InitSCAA(state.init);
        initTx.start(onInitDone);
        freeze();
        return initTx;
    }
    throw 'provider does not exists';
}

export async function getAccount(): Promise<types.GasFeesProvider> {
    if (state.gasProvider) {
        let gasProvider = await provider.getFeesAccount( state.gasProvider.address, state.gasProvider.key);
        if (gasProvider) {
            state.gasProvider = gasProvider;
            freeze();
        }
        return gasProvider;
    }
    throw 'error while creating gas provider';    
}

const normalizeDataArgs = (arg: string): string => {
    if (arg.startsWith('0x')) {
        arg = arg.substring(2);
    }
    return arg;
}

const toBytes32 = (hex: string): string => {
    hex = normalizeDataArgs(hex);
    let length = hex.length;
    for (let i = 0; i < 64-length; i++) {
        hex = '0'+hex;
    }
    return '0x'+hex;
}

const toNormalized32 = (hex: string): string => {
    return normalizeDataArgs(toBytes32(hex));
}
export async function transact(tx: types.TxAuthentication): Promise<string> {
    // try {
        let account: types.AccountState = await network.accountState(tx.transaction.from);
        if (account.cert) {
            const difficulty = Math.floor(tx.difficulty*tx.difficultyUnit/1000*DIF_PER_SECOND);
            let certAccess = crypto.preImageAccess(tx.transaction.from, tx.password, account.cert, difficulty);
            console.log({certAccess})
            if (certAccess) {
                let to = tx.transaction.to;
                let value: string = tx.transaction.value;
                let data = tx.transaction.data;
                let proof = certAccess.proof;

                to = normalizeDataArgs(to);
                value = toNormalized32(value);
                data = normalizeDataArgs(data);
                
                console.log({
                    to, value, data, proof
                });
                let comb = to+value+data+proof;
                let txCert = sha256('0x'+comb);
                let {hash} = await gasProvider.transactPreset({
                    transaction: tx.transaction,
                    cert: txCert,
                    // cert: NULL_CERT,
                }, certAccess.proof);
                const scaaTx = new pipeline.TransactionSCAA(hash, certAccess.proof);
                scaaTx.start();
                return hash
            }
        }
    // } catch(e: any){
    //     throw e;
    // } 
    return "";
}

export async function testPassword(tx: types.TxAuthentication): Promise<boolean> {
    let account: types.AccountState = await network.accountState(tx.transaction.from);
    if (account.cert) {
        const difficulty = Math.floor(tx.difficulty*tx.difficultyUnit/1000*DIF_PER_SECOND);
        let certAccess = crypto.preImageAccess(tx.transaction.from, tx.password, account.cert, difficulty);
        return !!certAccess;
    }
    return false;
}

export async function continueExpose(tx: types.TxAuthentication): Promise<any> {
    // try {
        let account: types.AccountState = await network.accountState(tx.transaction.from);
        if (account.processing === NULL_CERT) {
            throw "not in processing state";
        }
        if (account.cert) {
            const difficulty = Math.floor(tx.difficulty*tx.difficultyUnit/1000*DIF_PER_SECOND);
            let certAccess = crypto.preImageAccess(tx.transaction.from, tx.password, account.cert, difficulty);
            if (certAccess) {
                let proof: string = certAccess.proof;
                for (let pending of account.pending) {
                    console.log({pending});
                    let {to, value, data, cert}: any = pending;

                    to = normalizeDataArgs(to);
                    value = toNormalized32(ethers.utils.parseEther(value).toHexString());
                    data = normalizeDataArgs(data);
                    
                    // to = to.substring(2);
                    // value = ethers.utils.parseEther(value).toHexString().substring(2);
                    // for (let i = value.length; i < 64; i++) {
                    //     value = '0'+value;
                    // }
                    // data = data.substring(2)
                    console.log({proof, value, data, to, cert});
                    let comb = to+value+data+proof;
                    comb = comb.toLowerCase();
                    console.log(comb);
                    console.log(sha256('0x'+comb), cert);
                    if (cert === sha256('0x'+comb)) {
                        return {proof, pending};
                    }
                }

                return {proof};
            }
        }
    // } catch(e: any){
    //     throw e;
    // } 
    return "";
}

export const exposeContinues = async(account: string) => {
    let tx = await provider.exposeCont(account, state.gasProvider?.key||'');
    return tx;
}
export const expose = async (account: string, proof: string) => {
    let tx = await provider.expose({ address: account, proof });
    if (state) {
        console.log({tx})
        // state.expose = {
        //     hash: tx.hash,
        //     status: 'pending'
        // };    
    }
}

export const getBalances = async (address: string) => {
    return await provider.listBalances(address);
}

export const getHistory = async (address: string) => {
    return await provider.history(address);
}

