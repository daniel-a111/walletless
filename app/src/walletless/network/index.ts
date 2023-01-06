
import axios from 'axios';
import config from '../../config';
import * as walletlessTypes from '../types'
import * as types from './types'

const API_BASE_URL = `${config.API_BASE_URL}/api`

export async function account(address: string): Promise<walletlessTypes.Account> {
    return {}
}

export const accountState = async (address: string): Promise<walletlessTypes.AccountState> => {
    const res = await axios.post(`${API_BASE_URL}/account/state`, {
        address
    });
    return res.data.account;
}

export const receipt = async (hash: string): Promise<types.Tx|undefined> => {
    const res = await axios.get(`${API_BASE_URL}/reciept`, { params: {hash} });
    const receipt = res?.data?.receipt;
    let status = 'pending';
    if (receipt.status === 1) {
        status = 'done';
    } else if (receipt.status === 0) {
        status = 'failed'
    }
    if (receipt) {
        return {
            // from: '',
            // to: '',
            status: status,
            hash: hash
        }    
    }
}
