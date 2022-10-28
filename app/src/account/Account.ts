import * as Backend from "../backend";
import {
    loadAccountAddress,
    storeAccountAddress,
} from "./storage";
import { ethers } from "ethers";
import { NO_WALLET_ABI } from "../contracts/abis";
import { passwordsAndAddressAndCertAndNonceToProof, passwordsToCertsAndNonceAndAddress } from "../utils";
import { resetPasswordData, setRGFParamData, setRGFProviderData } from "../contracts";

let accountAddress: string|undefined = loadAccountAddress();

const { ethereum }: any = window;
let provider: any;
let signer: any;

if (ethereum) {
    provider = new ethers.providers.Web3Provider(ethereum);
    signer = provider?.getSigner();
}

export const topup = async (amount: number) => {
    let contract = new ethers.Contract(accountAddress||'', NO_WALLET_ABI, signer);
    let amountStr = amount.toString();
    if (amountStr.indexOf('.')<0) {
        amountStr += '.';
    }
    await contract.topup({ value: ethers.utils.parseEther(amountStr) });
}

export const getAccountAddress = (): string|undefined => {
    return accountAddress;
}

export const signup = async (password: string): Promise<string> => {
    accountAddress = await Backend.signup();
    storeAccountAddress(accountAddress);

    let { cert, nonceSize } = passwordsToCertsAndNonceAndAddress(password, accountAddress);

    await Backend.init(accountAddress, cert, nonceSize);
    return accountAddress;
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
    return (await getAccount()).feesAccount;
}
export const getAccountByAddress = async (address: string) => {
    return await Backend.getAccount(address);
}

export const getBalance = async (): Promise<number> => {
    return parseFloat((await getAccount()).balance);
}

export const getGasFeesBalance = async (): Promise<number> => {
    return parseFloat((await getAccount()).gasFeesBalance);
}

export const transact = async (to: string, value: string, data: string, password: string) => {
    let account = await getAccount();
    let proof = passwordsAndAddressAndCertAndNonceToProof(password, account.address, account.cert, account.nonce, account.nonceSize);
    await Backend.transact({ address: accountAddress, to, value, data, proof });
}


export const transactPreset = async (to: string, value: string, data: string, password: string) => {
    let account = await getAccount();
    let proof = passwordsAndAddressAndCertAndNonceToProof(password, account.address, account.cert, account.nonce, account.nonceSize);
    console.log({ proof })
    await Backend.transactPreset({ address: accountAddress, to, value, data });
}

const signTransactionAndProof = (tx: any, proof: string) => {
    let { to, value, data }: any = tx;
    data = data.substring(2);
    let valueHex = value.toHexString().substring(2);
    let vhl = valueHex.length;
    for (let i = 0; i < 64-vhl; i++) {
      valueHex = '0'+valueHex;
    }
    console.log({ perc: to+valueHex+data+proof })
    console.log(to+valueHex+data+proof)
    let txCert = ethers.utils.sha256(to+valueHex+data+proof);
    return { txCert };
}

export const resetPassword = async (newPassword: string, oldPassword: string) => {
    let account = await getAccount();
    let proof = passwordsAndAddressAndCertAndNonceToProof(oldPassword, account.address, account.cert, account.nonce, account.nonceSize);
    let {cert, nonceSize} = passwordsToCertsAndNonceAndAddress(newPassword, account.address);

    let data = await resetPasswordData(account.address, cert, nonceSize);
    let address = account.address;
    let to = address;
    let value = ethers.utils.parseEther('0.0');
    let {txCert} = signTransactionAndProof({ to, data, value }, proof);

    await Backend.transactPreset({ address, to, data, value: ethers.utils.formatEther(value), txCert });
    await Backend.expose({ address, proof });
}

export const setRGFParams = async (RGF: number, RGFM: number, MIN_RGF: number, password: string) => {
    let account = await getAccount();
    let proof = passwordsAndAddressAndCertAndNonceToProof(password, account.address, account.cert, account.nonce, account.nonceSize);
    let providerAddress = account.RGFProvider.address;

    console.log({ RGF, RGFM, MIN_RGF })
    let data = await setRGFParamData(providerAddress, RGF, RGFM, MIN_RGF);
    let address = account.address;
    let to = providerAddress;
    let value = ethers.utils.parseEther('0.0');
    let {txCert} = signTransactionAndProof({ to, data, value }, proof);
    console.log({ proof })
    console.log('0x'+proof);
    console.log({data});
    console.log(data);

    await Backend.transactPreset({ address, to, data, value: ethers.utils.formatEther(value), txCert });
    await Backend.expose({ address, proof });
}

export const setRGFProvider = async (RGFProvider: string, password: string) => {
    let account = await getAccount();
    let proof = passwordsAndAddressAndCertAndNonceToProof(password, account.address, account.cert, account.nonce, account.nonceSize);

    let data = await setRGFProviderData(account.address, RGFProvider);
    let address = account.address;
    let to = address;
    let value = ethers.utils.parseEther('0.0');
    let {txCert} = signTransactionAndProof({ to, data, value }, proof);

    console.log({proof});
    console.log('0x'+proof);
    await Backend.transactPreset({ address, to, data, value: ethers.utils.formatEther(value), txCert });
    await Backend.expose({ address, proof });
    // await Backend.setRGFProvider({ address: account.address, RGFProvider, proof });
}

export const testPassword = async (password: string): Promise<boolean> => {
    let account = await getAccount();
    let proof = passwordsAndAddressAndCertAndNonceToProof(password, account.address, account.cert, account.nonce, account.nonceSize);
    return !!proof;
}
