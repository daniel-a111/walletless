import axios from "axios";

import config from "../config";

const API_BASE_URL = `${config.API_BASE_URL}/api`

export const signup = async (): Promise<string> => {
    const res = await axios.post(`${API_BASE_URL}/signup`);
    console.log({ res });
    return res.data.account.address;
}

export const init = async (address: string, cert: string, nonceSize: number): Promise<string> => {
    const res = await axios.post(`${API_BASE_URL}/init`, {
        address, cert, nonceSize
    });
    console.log({ res });
    return res.data.account.address;
}

export const getAccount = async (address: string): Promise<any> => {
    const res = await axios.get(`${API_BASE_URL}/account`, {
        params: { address }
    });
    return res.data.account;
}

export const resetPasswords = async (address: string, cert: string, nonceSize: number, proof: string) => {
    const res = await axios.post(`${API_BASE_URL}/password`, {
        address, cert, nonceSize, proof
    });
    return res.data.approval;
}

export const transact = async ({address, to, value, data, proof}: any) => {
    const res = await axios.post(`${API_BASE_URL}/transact`, {
        address, to, value, data, proof
    });
    return res.data.transaction;
}

export const transactPreset = async ({address, to, value, data, txCert}: any) => {
    const res = await axios.post(`${API_BASE_URL}/transact/preset`, {
        address, to, value, data, txCert
    });
    return res.data.transaction;
}

export const expose = async ({address, proof}: any) => {
    const res = await axios.post(`${API_BASE_URL}/transact/expose`, {
        address, proof
    });
    return res.data.transaction;
}


// export const setRGFParams = async ({address, RGF, RGFM, MIN_RGF, proof}: any) => {
//     const res = await axios.post(`${API_BASE_URL}/RGF/params`, {
//         address, RGF, RGFM, MIN_RGF, proof
//     });
//     return res.data.transaction;
// }

// export const setRGFProvider = async ({address, RGFProvider, proof}: any) => {
//     const res = await axios.post(`${API_BASE_URL}/RGF`, {
//         address, RGFProvider, proof
//     });
//     return res.data.transaction;
// }