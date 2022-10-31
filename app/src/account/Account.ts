import * as Backend from "../backend";
import {
    loadAccountAddress,
    loadFeesAccountAddress,
    loadInitTxHash,
    loadSignupTxHash,
    storeAccountAddress,
    storeFeesAccountAddress,
    storeSignupTxHash,
} from "./storage";
import { ethers } from "ethers";
import { NO_WALLET_ABI } from "../contracts/abis";
import { passwordsAndAddressAndCertAndNonceToProof, passwordsToCertsAndNonceAndAddress } from "../utils";
import { resetPasswordData, setRGFParamData, setRGFProviderData } from "../contracts";

let signupTxHash: string|undefined = loadSignupTxHash();
let initTxHash: string|undefined = loadInitTxHash();
let accountAddress: string|undefined = loadAccountAddress();
let feesAccount: string|undefined = loadFeesAccountAddress();

const { ethereum }: any = window;
let provider: any;
let signer: any;

if (ethereum) {
    provider = new ethers.providers.Web3Provider(ethereum);
    signer = provider?.getSigner();
}

export const clearAccount = () => {
    storeAccountAddress(null);
    storeFeesAccountAddress(null);
}

export const topup = async (address: string, amount: number) => {
    let contract = new ethers.Contract(address||'', NO_WALLET_ABI, signer);
    let amountStr = amount.toString();
    if (amountStr.indexOf('.')<0) {
        amountStr += '.';
    }
    await contract.topup({ value: ethers.utils.parseEther(amountStr) });
}

export const getAccountAddress = (): string|undefined => {
    return accountAddress;
}

export const deployAccount = async () => {
    signupTxHash = await Backend.signup(feesAccount||'');
    storeSignupTxHash(signupTxHash);
    return signupTxHash;
}

export const initAccount = async (password: string) => {

    let accountAddress = loadAccountAddress();
    console.log({ accountAddress })
    if (accountAddress) {
        let { cert, nonceSize } = passwordsToCertsAndNonceAndAddress(password, accountAddress||'');
        initTxHash = await Backend.init(accountAddress||'', cert, nonceSize, feesAccount||'');
        return initTxHash;
    }
}

export const signin = async (address: string, password: string): Promise<boolean> => {
    let account = await getAccountByAddress(address);
    let proof = passwordsAndAddressAndCertAndNonceToProof(password, account.address, account.cert, account.nonce, account.nonceSize);
    if (!!proof) {
        accountAddress = address;
    }
    return !!proof;

}

export const getAccount = async () => {
    if (accountAddress) {
        return await Backend.getAccount(accountAddress);
    }
}
export const getFeesAccountAddress = async (): Promise<string> => {
    if (!account?.feesAccount && !feesAccount) {
        let { feesAccount: fa, balance }: any = await Backend.getFeesAccount(feesAccount);
        storeFeesAccountAddress(fa);
        feesAccount = fa;
    }
    return account?.feesAccount||feesAccount;
}
export const getFeesAccountBalance = async (): Promise<string> => {
    let { feesAccount: fa, balance }: any = await Backend.getFeesAccount(feesAccount);
    storeFeesAccountAddress(fa);
    feesAccount = fa;
    return balance;
}
export const getAccountByAddress = async (address: string) => {
    return await Backend.getAccount(address);
}

export const getBalance = async (): Promise<number> => {
    return parseFloat(account?.balance||'0');
}

export const getGasFeesBalance = async (): Promise<number> => {
    return parseFloat(account?.gasFeesBalance||'0');
}

export const transact = async (to: string, value: string, data: string, password: string) => {
    let account = await getAccount();
    let proof = passwordsAndAddressAndCertAndNonceToProof(password, account.address, account.cert, account.nonce, account.nonceSize);
    if (proof) {
        await Backend.transact({ address: accountAddress, to, value, data, proof });
    } else {
        // TODO handle errors
    }
}


export const transactPreset = async (to: string, value: string, data: string, password: string) => {
    let account = await getAccount();
    let proof = passwordsAndAddressAndCertAndNonceToProof(password, account.address, account.cert, account.nonce, account.nonceSize);
    console.log({ proof })
    if (proof) {
        await Backend.transactPreset({ address: accountAddress, to, value, data });
    }
}

const signTransactionAndProof = (tx: any, proof: string) => {
    let { to, value, data }: any = tx;
    data = data.substring(2);
    let valueHex = value.toHexString().substring(2);
    let vhl = valueHex.length;
    for (let i = 0; i < 64-vhl; i++) {
      valueHex = '0'+valueHex;
    }
    let txCert = ethers.utils.sha256(to+valueHex+data+proof);
    return { txCert };
}

export const resetPassword = async (newPassword: string, oldPassword: string) => {
    let account = await getAccount();
    let proof = passwordsAndAddressAndCertAndNonceToProof(oldPassword, account.address, account.cert, account.nonce, account.nonceSize);
    let {cert, nonceSize} = passwordsToCertsAndNonceAndAddress(newPassword, account.address);

    if (proof) {
        let data = await resetPasswordData(account.address, cert, nonceSize);
        let address = account.address;
        let to = address;
        let value = ethers.utils.parseEther('0.0');
        let {txCert} = signTransactionAndProof({ to, data, value }, proof);
        await Backend.transactPreset({ address, to, data, value: ethers.utils.formatEther(value), txCert });
        await Backend.expose({ address, proof });
    }
}

export const setRGFParams = async (RGF: number, RGFM: number, MIN_RGF: number, password: string) => {
    let account = await getAccount();
    let proof = passwordsAndAddressAndCertAndNonceToProof(password, account.address, account.cert, account.nonce, account.nonceSize);
    let providerAddress = account.RGFProvider.address;

    if (proof) {
        let data = await setRGFParamData(providerAddress, RGF, RGFM, MIN_RGF);
        let address = account.address;
        let to = providerAddress;
        let value = ethers.utils.parseEther('0.0');
        let {txCert} = signTransactionAndProof({ to, data, value }, proof);
        await Backend.transactPreset({ address, to, data, value: ethers.utils.formatEther(value), txCert });
        await Backend.expose({ address, proof });
    }
}

export const setRGFProvider = async (RGFProvider: string, password: string) => {
    let account = await getAccount();
    let proof = passwordsAndAddressAndCertAndNonceToProof(password, account.address, account.cert, account.nonce, account.nonceSize);

    if (proof) {
        let data = await setRGFProviderData(account.address, RGFProvider);
        let address = account.address;
        let to = address;
        let value = ethers.utils.parseEther('0.0');
        let {txCert} = signTransactionAndProof({ to, data, value }, proof);
        await Backend.transactPreset({ address, to, data, value: ethers.utils.formatEther(value), txCert });
        await Backend.expose({ address, proof });
    }
}

export const testPassword = async (password: string): Promise<boolean> => {
    let account = await getAccount();
    let proof = passwordsAndAddressAndCertAndNonceToProof(password, account.address, account.cert, account.nonce, account.nonceSize);
    return !!proof;
}

let account: any;
const updateAccount = async () => {
    if (accountAddress) {
        account = await getAccount()
    }
    setTimeout(updateAccount, 2000);
};
updateAccount();
