import * as types from "../network/types";
import * as network from '../network';
import * as provider from '../gas/provider';
import { Exception } from "sass";
import { getState } from "..";
export * as types from "../types";

const LOOP_SLEEP_SEC = 1;


export class InitSCAA {
    tx: types.Tx;
    onDone: CallableFunction|undefined;
    state: string;
    constructor(tx: types.Tx) {
        this.tx = tx;
        this.state = tx.status;
    }

    getState() {
        return this.state;
    }

    start(onDone?: CallableFunction) {
        this.onDone = onDone;
        this.processLoop();
    }

    async processLoop() {
        try {
            let tx: any = await provider.initTxStatus(this.tx.hash);
            if (tx) {
                this.tx = tx;
                if (this.tx.status !== 'pending') {
                    if (this.onDone) {
                        this.onDone();
                    }
                    return;
                }    
            }
        } catch(e: any) {
            console.error(e?.message||e);
        }
        setTimeout(() => {
            this.processLoop();
        }, 1000*LOOP_SLEEP_SEC);    
    }
}


export class DeploySCAA {
    tx: types.Tx;
    onDone: CallableFunction|undefined;
    state: string;
    account: any;
    constructor(tx: types.Tx) {
        this.tx = tx;
        this.state = tx.status;
    }

    getState() {
        return this.state;
    }

    start(onDone?: CallableFunction) {
        this.onDone = onDone;
        this.processLoop();
    }

    async processLoop() {
        if (this.tx.status === 'pending') {
            let { tx, account }: any = await provider.signupTxStatus(this.tx.hash);
            if (tx?.status === 'done') {
                this.account = account;
                this.tx.status = 'done';
                this.state = 'done';
            }
            this.tx.status = tx?.status||this.tx.status;
            this.state = tx?.status||this.state;
            console.log({tx, account});
        }

        if (this.tx.status === 'pending') {
            setTimeout(() => {
                this.processLoop();
            }, 1000*LOOP_SLEEP_SEC);    
        } else if (this.onDone) {
            this.onDone(this.account);
        }
    }
}

export class TransactionSCAA {
    preset: types.Tx;
    expose?: types.Tx;
    exposeCont?: types.Tx;
    account?: string;
    message?: string;
    proof?: string;
    gasLimit?: number;
    
    constructor(hash: string, proof?: string) {
        this.preset = { hash, status: 'pending' };
        this.proof = proof;
    }

    setProof(proof: string) {
        this.proof = proof;
    }

    setGasLimit(gasLimit: number) {
        this.gasLimit = gasLimit;
    }

    start() {
        this.processLoop();
    }

    async processLoop() {
        if (this.preset.status === 'pending') {
            this.processPresetPending()
        } else if (this.preset.status === 'done') {
            this.processPresetDone()
        } else {
            this.processPresetFailed();
        }

        if (this.preset.status !== 'failed') {
            setTimeout(() => {
                this.processLoop();
            }, 1000*LOOP_SLEEP_SEC);    
        }
    }

    async _loadReceipt(txHash: string) {
        return await network.receipt(txHash);
    }

    async processPresetPending() {
        let receipt = await network.receipt(this.preset.hash);
        console.log({ receipt })
        console.log(this.preset.hash);
        if (receipt) {
            this.account = getState().account?.address;
            this.preset.status = receipt.status;
        } else {
            this.preset.status = 'failed';
            this.message = 'receipt not found';
        }
    }

    async processPresetDone() {
        if (this.expose) {
            if (this.expose.status === 'pending') {
                await this.processExposePending();
            } else if (this.expose.status === 'done') {
                await this.processExposeDone();
            } else {
                this.processExposeFailed();
            }
        } else {
            await this.processPresetDoneExposeUndefined();
        }
    }

    processPresetFailed() {
        this.message = 'failed to preset';
    }

    async processPresetDoneExposeUndefined() {

        // let account: types.AccountState = await network.accountState(tx.transaction.from);

        // let account: NewType = await network.accountState(tx.transaction.from);

        console.log(this.proof)
        console.log({ account: await network.accountState(this.account||'') })
        let tx = await provider.expose({ address: this.account, proof: this.proof });
        this.expose = {
            hash: tx.hash,
            status: 'pending'
        };
    }

    async processExposePending() {
        if (this.expose) {
            let receipt = await network.receipt(this.expose.hash);
            if (receipt) {
                this.expose.status = receipt.status;
            } else {
                this.expose.status = 'failed';
                this.message = 'receipt not found';
            }    
        } else {
            throw 'expose tx is not exists. use processPresetDoneExposeUndefined instead.';
        }
    }

    async processExposeDone() {
        if (this.exposeCont) {
            if (this.exposeCont.status === 'pending') {
                await this.processExposeContPending();
            } else if (this.exposeCont.status === 'done') {
                this.processExposeContDone()
            } else {
                this.processExposeContFailed();
            }
        } else {
            let state = await network.accountState(getState().account?.address||'');
            if (state.txProcessing) {
                await this.processExposeContIsRequiredAndUndefined();
            }
        }
    }

    processExposeFailed() {
        this.message = 'failed to expose';
    }

    async processExposeContIsRequiredAndUndefined() {
        if (!this.account) {
            throw 'account is undefined';
        }
        let tx = await provider.exposeCont(this.account||'', '');
        this.exposeCont = {
            hash: tx.hash,
            status: 'pending'
        }
    }

    async processExposeContPending() {
        if (this.exposeCont) {
            let receipt = await network.receipt(this.exposeCont.hash);
            if (receipt) {
                this.exposeCont.status = receipt.status;
            } else {
                this.exposeCont.status = 'failed';
                this.message = 'receipt not found';
            }    
        } else {
            throw 'expose cont tx is not exists. use processExposeContinueRequiredAndUndefined instead.';
        }
    }

    processExposeContDone() {}

    processExposeContFailed() {
        this.message = 'expose continue failed. try again.'
    }
}
