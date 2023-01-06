export const FEES_ACCOUNT = 'fees-account';
export const TX_HASH_DEPLOY = 'tx-hash-deploy';
export const WALLETLESS_FREEZE = 'walletless-freeze';

// const ACCOUNT_ADDRESS = 'account_address';
// // const FEES_ACCOUNT_ADDRESS = 'fees_account_address';
// const SIGNUP_TX_HAS = 'signup-tx-hash';
// const INIT_TX_HAS = 'init-tx-hash';
// const PRESET_TX_HASH = 'preset-tx-hash';
// const EXPOSE_TX_HASH = 'expose-tx-hash';
// const TRANSACT = 'transact';

export const localGetter = (key: string) => {
    return localStorage.getItem(key) || undefined;
}

export const localSetter = (key: string, value: string|null) => {
    if (value) {
        localStorage.setItem(key, value);
    } else {
        localStorage.removeItem(key);
    }
}

export const localGetterObject = (key: string) => {
    return JSON.parse(localGetter(key) || 'null');
}

export const localSetterObject = (key: string, value: any) => {
    localSetter(key, value ? JSON.stringify(value) : null);
}

// export const loadAccountAddress = (): string|undefined => {
//     return localGetter(ACCOUNT_ADDRESS)||undefined;
// }

// export const storeAccountAddress = (address: string|null) => {
//     localSetter(ACCOUNT_ADDRESS, address);
// }

// // export const loadFeesAccountAddress = (): string|undefined => {
// //     return localGetter(FEES_ACCOUNT_ADDRESS)||undefined;
// // }

// // export const storeFeesAccountAddress = (address: string|null) => {
// //     localSetter(FEES_ACCOUNT_ADDRESS, address);
// // }

// export const loadSignupTxHash = (): string|undefined => {
//     return localGetter(SIGNUP_TX_HAS)||undefined;
// }

// export const storeSignupTxHash = (hash: string|null) => {
//     localSetter(SIGNUP_TX_HAS, hash);
// }

// export const loadInitTxHash = (): string|undefined => {
//     return localGetter(INIT_TX_HAS)||undefined;
// }

// export const storeInitTxHash = (hash: string|null) => {
//     localSetter(INIT_TX_HAS, hash);
// }

// export const loadPresetTxHash = (): string|undefined => {
//     return localGetter(PRESET_TX_HASH)||undefined;
// }

// export const storePresetTxHash = (hash: string|null) => {
//     localSetter(PRESET_TX_HASH, hash);
// }

// export const loadExposeTxHash = (): string|undefined => {
//     return localGetter(EXPOSE_TX_HASH)||undefined;
// }

// export const storeExposeTxHash = (hash: string|null) => {
//     localSetter(EXPOSE_TX_HASH, hash);
// }

export interface Transact {
    to: string;
    value: number;
    data?: string;
}

// export const loadTransact = (): Transact|undefined => {
//     return localGetterObject(TRANSACT)||undefined;
// }

// export const storeTransact = (transact: Transact|undefined) => {
//     localSetterObject(TRANSACT, transact);
// }
