import * as types from './types'

export const status =  async (txHash: string): Promise<types.TxStatus> => {
    return 'pending';
}