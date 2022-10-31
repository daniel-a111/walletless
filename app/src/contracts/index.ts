import { ethers } from "ethers";
import { MANUAL_RGF_PROVIDER_ABI, NO_WALLET_ABI } from "./abis";


export const resetPasswordData = async (address: string, cert: string, nonceSize: number) => {
    let c = new ethers.Contract(address, NO_WALLET_ABI);
    const iface = c.interface;
    return iface.encodeFunctionData('resetPassword', ['0x'+cert, nonceSize]);
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

