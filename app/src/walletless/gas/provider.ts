import axios from "axios";

import config from "../../config";
import { Tx } from "../network/types";
import * as types from "../types"

const API_BASE_URL = `${config.API_BASE_URL}/api`


export class FeesAccount {
    _address: string;
    _key: string;
    _balance: string;
    constructor(address: string, key: string) {
        this._address = address;
        this._key = key;
        this._balance = '0.0';
        this._load();
    }

    async _load() {
        try {
            const res = await axios.post(`${API_BASE_URL}/fees-account`, { address: this._address, key: this._key });
            const address = res.data?.provider?.address;
            const balance = res.data?.provider?.balance;
            if (address) {
                this._balance = balance;
            } else {
                console.error(res.data.error);
            }    
        } catch(e: any) {
            console.error(e.message||JSON.stringify(e));
        }

        const that = this;
        setTimeout(() => {
            that._load();
        }, 2000);
    }
    address() {
        return this._address;
    }
    key() {
        return this._key;
    }
    balance() {
        return this._balance;
    }
}

let feesAccout: FeesAccount|undefined;
export const loggedIn = (): FeesAccount|undefined => {
    return feesAccout;
}
export const login = (address: string, key: string): FeesAccount => {
    feesAccout = new FeesAccount(address, key);
    return feesAccout;
}

export async function createGasFeeProvider(): Promise<any> {
    const res = await axios.post(`${API_BASE_URL}/providers`, {});
    const address = res.data?.provider?.address;
    const key = res.data?.provider?.key;
    if (address && key) {
        return { gasProvider: res.data?.provider, account: res.data?.account };
    } else {
        throw new Error(res.data.error);
    }
}

export const getFeesAccount = async (address?:string, key?:string): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/fees-account`, {address, key});
    return { gasProvider: res.data?.provider, account: res.data?.account };
}

export const signup = async (feesAddress: string, key: string): Promise<Tx> => {
    const res = await axios.post(`${API_BASE_URL}/signup`, { feesAddress, key });
    if (res.data?.tx) {
        return res.data.tx;
    } else {
        throw new Error(res.data.error);
    }
}

export const init = async (address: string, cert: string, feesAddress: string, key: string): Promise<Tx> => {
    const res = await axios.post(`${API_BASE_URL}/init`, {
        address, cert, feesAddress, key
    });
    if (res.data?.tx) {
        return res.data.tx;
    } else {
        throw new Error(res.data.error);
    }
}

export const getGasMarket = async (): Promise<string> => {
    const res = await axios.get(`${API_BASE_URL}/gas`);
    return res.data;
}

export const resetPasswords = async (address: string, cert: string, nonceSize: number, proof: string, maxFeePerGas: number, maxPriorityFeePerGas: number) => {
    const res = await axios.post(`${API_BASE_URL}/password`, {
        address, cert, nonceSize, proof, maxFeePerGas, maxPriorityFeePerGas
    });
    return res.data.approval;
}

export const transactPreset = async (tx: types.SignedTransaction, proofProof: string) => {
    const res = await axios.post(`${API_BASE_URL}/transact/preset`, {
        address: tx.transaction.from,
        to: tx.transaction.to,
        value: tx.transaction.value,
        data: tx.transaction.data,
        txCert: tx.cert
    });
    return res.data.transaction;
}

export const expose = async ({address, proof}: any) => {
    const res = await axios.post(`${API_BASE_URL}/transact/expose`, {
        address, proof
    });
    return res.data.transaction;
}

export const exposeCont = async (address: string, key: string) => {
    const res = await axios.post(`${API_BASE_URL}/transact/expose/cont`, {
        address, key
    });
    return res.data;
}

export const signupTxStatus = async (hash: string): Promise<any> => {
    const res = await axios.get(`${API_BASE_URL}/tx/status/singup`, { params: {hash} });
    console.log({ res });
    return res.data;
}

export const initTxStatus = async (hash: string): Promise<boolean> => {
    const res = await axios.get(`${API_BASE_URL}/tx/status/init`, { params: {hash} });
    console.log({ res });
    return res.data;
}

export const listBalances = async (address: string): Promise<any[]> => {
    const res = await axios.get(`${API_BASE_URL}/address/balances`, { params: {address} });
    console.log({ res });
    return res.data.balances;
}

export const history = async (address: string): Promise<any[]> => {
    const res = await axios.get(`${API_BASE_URL}/address/history`, { params: {address} });
    console.log({ res });
    return res.data;
}