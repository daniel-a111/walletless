
export type DifficultyUnit = 'MS' | 'SEC' | 'MIN' | 'HOUR' | 'DAY';

export interface Account {
    address?: string;
    cert?: string;
}

export interface ScaaTransaction {
    to: string;
    value: number;
    data: string;
    cert: string;
}

export interface AccountState {
    cert: string;
    processing: string;
    pending: ScaaTransaction[];
    pendingCounter: number;
    pendingAttackCounter: number;
    active: boolean;
    txProcessing: boolean;
    processingCursor: number;
    rgfProvider: string;
}

export interface GasFeesProvider {
    address: string;
    key?: string;
    balance: string;
    SCAA?: string;
}

export interface TxMessage {
    from: string;
    to: string;
    value: string;
    data: string;
    gasLimit?: number;
    gasPrice?: number;
}

export interface TxAuthentication {
    transaction: TxMessage;
    password: string;
    difficulty: number;
    difficultyUnit:number;
}

export interface SignedTransaction {
    transaction: TxMessage;
    cert: string;
}

class AccountAddress {
    address: string;
    constructor(address: string) {
        this.address = address;
        this._validate();
    }
    _validate() {
        // through exception if nessacery
        return true;
    }
    is(address: string) {
        return this.address == address;
    }
    toString() {
        return this.address;
    }
}
