import { ethers } from "ethers";
import { MANUAL_RGF_PROVIDER_ABI, NO_WALLET_ABI } from "./abis";

const { ethereum }: any = window;
let provider: any;
let signer: any;

if (ethereum) {
    provider = new ethers.providers.Web3Provider(ethereum);
    signer = provider?.getSigner();
}


export const resetPasswordData = async (address: string, cert: string, nonceSize: number) => {
    let c = new ethers.Contract(address, NO_WALLET_ABI);
    const iface = c.interface;
    return iface.encodeFunctionData('resetPassword', [cert, nonceSize]);
}

export const setRGFProviderData = async (address: string, RGFProvider: string) => {
    let c = new ethers.Contract(address, NO_WALLET_ABI);
    const iface = c.interface;
    return iface.encodeFunctionData('setRGFProvider', [ RGFProvider ]);
}

export const setRGFParamData = async (address: string, RGF_NEW: number, RGFM_NEW: number, MIN_RGF_NEW: number) => {
    let c = new ethers.Contract(address, MANUAL_RGF_PROVIDER_ABI);
    const iface = c.interface;
    console.log(iface.encodeFunctionData('set', [ RGF_NEW, RGFM_NEW, MIN_RGF_NEW ]));
    return iface.encodeFunctionData('set', [ RGF_NEW, RGFM_NEW, MIN_RGF_NEW ]);
}

export const topupData = async (address: string) => {
    let c = new ethers.Contract(address, NO_WALLET_ABI);
    const iface = c.interface;
    return iface.encodeFunctionData('payment', []);
}


export const topup = async (account: string, amount: string) => {
    console.log(amount)
    let contract = new ethers.Contract(account||'', NO_WALLET_ABI, signer);
    // let amount = amount.toString();
    if (amount.indexOf('.')<0) {
        amount += '.';
    }
    await contract.payment({ value: ethers.utils.parseEther(amount) });
}
