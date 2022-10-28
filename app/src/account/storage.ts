const ACCOUNT_ADDRESS = 'account_address';
const GATEWAY_COUNTER = 'gateway-counter';

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

export const storeAccountAddress = (address: string) => {
    localSetter(ACCOUNT_ADDRESS, address);
}

export const loadGatewayCounter = (): number => {
    return parseFloat(localGetter(GATEWAY_COUNTER)||'0')||0;
}

export const storeGatewayCounter = (balance: number|null) => {
    localSetter(GATEWAY_COUNTER, balance?.toString()||'0');
}