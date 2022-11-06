import axios from "axios";

import config from "../config";

const API_BASE_URL = `${config.API_BASE_URL}/api`

export const signup = async (feesAddress: string): Promise<string> => {
    const res = await axios.post(`${API_BASE_URL}/signup`, { feesAddress });
    if (res.data?.tx?.hash) {
        return res.data.tx.hash;
    } else {
        throw new Error(res.data.error);
    }
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

export const receipt = async (hash: string): Promise<string> => {
    const res = await axios.get(`${API_BASE_URL}/reciept`, { params: {hash} });
    console.log({ res });
    return res.data;
}

export const getFeesAccount = async (address?:string): Promise<string> => {
    const res = await axios.post(`${API_BASE_URL}/fees-account`, {address});
    console.log({ res });
    return res.data;
}

export const getGasMarket = async (): Promise<string> => {
    const res = await axios.get(`${API_BASE_URL}/gas`);
    console.log({ res });
    return res.data;
}

export const init = async (address: string, cert: string, nonceSize: number, feesAddress: string): Promise<string> => {
    const res = await axios.post(`${API_BASE_URL}/init`, {
        address, cert, nonceSize, feesAddress
    });
    console.log({ res });
    return res.data.tx.hash;
}

export const getAccount = async (address: string): Promise<any> => {
    const res = await axios.get(`${API_BASE_URL}/account`, {
        params: { address }
    });
    return res.data.account;
}

export const getRGFProvider = async (address: string): Promise<any> => {
    const res = await axios.get(`${API_BASE_URL}/account/RGF`, {
        params: { address }
    });
    return res.data;
}

export const resetPasswords = async (address: string, cert: string, nonceSize: number, proof: string, maxFeePerGas: number, maxPriorityFeePerGas: number) => {
    const res = await axios.post(`${API_BASE_URL}/password`, {
        address, cert, nonceSize, proof, maxFeePerGas, maxPriorityFeePerGas
    });
    return res.data.approval;
}

export const transactPreset = async ({address, to, value, data, txCert, gasMethod}: any) => {
    const res = await axios.post(`${API_BASE_URL}/transact/preset`, {
        address, to, value, data, txCert, gasMethod
    });
    return res.data;
}

export const expose = async ({address, proof}: any) => {
    const res = await axios.post(`${API_BASE_URL}/transact/expose`, {
        address, proof
    });
    return res.data;
}

export const exposeCont = async (address: string) => {
    const res = await axios.post(`${API_BASE_URL}/transact/expose/cont`, {
        address
    });
    return res.data;
}
