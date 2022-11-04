import axios from "axios";

import config from "../config";

const API_BASE_URL = `${config.API_BASE_URL}/api`

export const signup = async (feesAddress: string, maxFeePerGas: number, maxPriorityFeePerGas: number): Promise<string> => {
    const res = await axios.post(`${API_BASE_URL}/signup`, { feesAddress, maxFeePerGas, maxPriorityFeePerGas });
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

export const init = async (address: string, cert: string, nonceSize: number, feesAddress: string, maxFeePerGas: number, maxPriorityFeePerGas: number): Promise<string> => {
    const res = await axios.post(`${API_BASE_URL}/init`, {
        address, cert, nonceSize, feesAddress, maxFeePerGas, maxPriorityFeePerGas
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

export const transactPreset = async ({address, to, value, data, txCert, maxFeePerGas, maxPriorityFeePerGas}: any) => {
    const res = await axios.post(`${API_BASE_URL}/transact/preset`, {
        address, to, value, data, txCert, maxFeePerGas, maxPriorityFeePerGas
    });
    return res.data;
}

export const expose = async ({address, proof, maxFeePerGas, maxPriorityFeePerGas}: any) => {
    const res = await axios.post(`${API_BASE_URL}/transact/expose`, {
        address, proof, maxFeePerGas, maxPriorityFeePerGas
    });
    return res.data;
}

export const exposeCont = async (address: string, maxFeePerGas: number, maxPriorityFeePerGas: number) => {
    const res = await axios.post(`${API_BASE_URL}/transact/expose/cont`, {
        address, maxFeePerGas, maxPriorityFeePerGas
    });
    return res.data;
}
