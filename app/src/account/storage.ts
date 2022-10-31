const ACCOUNT_ADDRESS = 'account_address';
const FEES_ACCOUNT_ADDRESS = 'fees_account_address';
const SIGNUP_TX_HAS = 'signup-tx-hash';
const INIT_TX_HAS = 'init-tx-hash';

const localGetter = (key: string) => {
    return localStorage.getItem(key) || null;
}

const localSetter = (key: string, value: string|null) => {
    if (value) {
        localStorage.setItem(key, value);
    } else {
        localStorage.removeItem(key);
    }
}

const localGetterObject = (key: string) => {
    return JSON.parse(localGetter(key) || 'null');
}

const localSetterObject = (key: string, value: any) => {
    localSetter(key, value ? JSON.stringify(value) : null);
}

export const loadAccountAddress = (): string|undefined => {
    return localGetter(ACCOUNT_ADDRESS)||undefined;
}

export const storeAccountAddress = (address: string|null) => {
    localSetter(ACCOUNT_ADDRESS, address);
}

export const loadFeesAccountAddress = (): string|undefined => {
    return localGetter(FEES_ACCOUNT_ADDRESS)||undefined;
}

export const storeFeesAccountAddress = (address: string|null) => {
    localSetter(FEES_ACCOUNT_ADDRESS, address);
}

export const loadSignupTxHash = (): string|undefined => {
    return localGetter(SIGNUP_TX_HAS)||undefined;
}

export const storeSignupTxHash = (hash: string|null) => {
    localSetter(SIGNUP_TX_HAS, hash);
}

export const loadInitTxHash = (): string|undefined => {
    return localGetter(INIT_TX_HAS)||undefined;
}

export const storeInitTxHash = (hash: string|null) => {
    localSetter(INIT_TX_HAS, hash);
}
