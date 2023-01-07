import axios from "axios";

import config from "../../config";
import { Tx } from "../network/types";
import * as types from "../types";

const API_BASE_URL = `${config.API_BASE_URL}/api`;


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
type HttpMethod = 'get' | 'post';
const httpCall = async (method: HttpMethod, url: string, options: any) => {
    const res = await axios[method](url, options);
    return res.data
}
const httpCallPost = async (uri: string, body?: any) => {
    return await httpCall('post', `${API_BASE_URL}${uri}`, body);
}
const httpCallGet = async (uri: string, query?: any) => {
    return await httpCall('get', `${API_BASE_URL}${uri}`, { params: query });
}
export const passwordLogin = async (address: string, pp: string) => {
    return await httpCallPost('/auth/login', { address, pp });
}

export async function createGasFeeProvider(): Promise<any> {
    const data = await httpCallPost('/providers');
    const { address, key } = data.provider;
    if (address && key) {
        return { gasProvider: data.provider, account: data.account };
    } else {
        throw new Error(data.error);
    }
}

export const getFeesAccount = async (address?:string, key?:string): Promise<any> => {
    const data = await httpCallPost('/fees-account', { address, key });
    return { gasProvider: data.provider, account: data.account };
}

export const signup = async (feesAddress: string, key: string): Promise<Tx> => {
    const data = await httpCallPost('/signup', { feesAddress, key });
    if (data?.tx) {
        return data.tx;
    } else {
        throw new Error(data.error);
    }
}

export const init = async (address: string, cert: string, feesAddress: string, key: string): Promise<Tx> => {
    const data = await httpCallPost('/init', {
        address, cert, feesAddress, key
    });
    if (data.tx) {
        return data.tx;
    } else {
        throw new Error(data.error);
    }
}

export const getGasMarket = async (): Promise<string> => {
    return await httpCallGet('/gas');
}

export const resetPasswords = async (address: string, cert: string, nonceSize: number, proof: string, maxFeePerGas: number, maxPriorityFeePerGas: number) => {
    const data = await httpCallPost('/password', {
        address, cert, nonceSize, proof, maxFeePerGas, maxPriorityFeePerGas
    });
    return data.approval;
}

export const transactPreset = async (tx: types.SignedTransaction, proofProof: string) => {
    const data = await httpCallPost('/transact/preset', {
        address: tx.transaction.from,
        to: tx.transaction.to,
        value: tx.transaction.value,
        data: tx.transaction.data,
        txCert: tx.cert
    });
    return data.transaction;
}

export const expose = async ({address, proof}: any) => {
    const data = await httpCallPost('/transact/expose', {
        address, proof
    });
    return data.transaction;
}

export const exposeCont = async (address: string, key: string) => {
    return await httpCallPost('/transact/expose/cont', {
        address, key
    });
}

export const signupTxStatus = async (hash: string): Promise<any> => {
    return await httpCallGet('/tx/status/singup', { hash });
}

export const initTxStatus = async (hash: string): Promise<boolean> => {
    return await httpCallGet('/tx/status/init', { hash });

}

export const listBalances = async (address: string): Promise<any[]> => {
    const data = await httpCallGet('/address/balances', { address });
    return data.balances;
}

export const history = async (address: string): Promise<any[]> => {
    return await httpCallGet('/address/history', { address });
}