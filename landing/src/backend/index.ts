import axios from "axios";

import config from "../config";

const API_BASE_URL = `${config.API_BASE_URL}/api`


export async function contact(email: string, message: string): Promise<any> {
    const res = await axios.post(`${API_BASE_URL}/contact`, { email, message });
    if (res.data?.success) {
        return res.data?.message;
    } else {
        throw new Error(res.data.error);
    }
}

export async function subscribe(email: string): Promise<any> {
    const res = await axios.post(`${API_BASE_URL}/subscribe`, { email });
    if (res.data?.success) {
        return res.data?.message;
    } else {
        throw new Error(res.data.error);
    }
}
