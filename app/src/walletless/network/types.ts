
export type TxStatus = 'pending' | 'done' | 'failed';

export interface Tx {
    hash: string;
    status: string;
}

export interface Receipt {
    from: string;
    to: string;
    transactionHash: string;
    status: TxStatus;
}