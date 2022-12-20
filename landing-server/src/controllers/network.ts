import { Request, Response, NextFunction } from 'express';
import { ethers } from "hardhat";
import { CONTRACT_NAME, RGF_MANUAL_CONTRACT_NAME } from '../constants';
import axios from 'axios';


export const receipt = async (req: Request, res: Response, next: NextFunction) => {

    let { hash }: any = req.query;

    // // TODO cheap deploy
    const [owner] = await ethers.getSigners();
    try {
        let receipt = await owner.provider?.getTransactionReceipt(hash);
        console.log({receipt})
        return res.status(200).json({ receipt });
    } catch(e: any) {
        // throw e;
        return res.status(200).json({ error: e?.message||JSON.stringify(e)});
    }
}


const loadAccount = async (address: string, rgfDetailed: boolean=false) => {

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
    const wallet = TwoFactorWallet.attach(address);

    let { cert, nonce, active: isActive, pending: pendingArr, pendingCounter,
        pendingAttackCounter, txProcessing, processingCursor, rgfProvider } = await wallet.getState();
    let pending: any[] = [];
    for (let i = 0; i < pendingArr.length; i++) {
        let { to, value, data, cert } = pendingArr[i];
        pending.push({ to, value: ethers.utils.formatEther(value), data, cert });
    }

    let account: any = {
        address,
        cert,
        nonce: parseInt(ethers.utils.formatUnits(nonce, 0)),
        balance: ethers.utils.formatEther(await owner.provider?.getBalance(address)||'0'),
        isActive, pending, pendingCounter,
        pendingAttackCounter: parseInt(ethers.utils.formatUnits(pendingAttackCounter, 0)), txProcessing, processingCursor,
        rgfProvider
    }

    return account;
}


export const getAccount = async (req: Request, res: Response, next: NextFunction) => {
    let { address }: any = req.query;
    if (req.body?.address) {
        address = req.body.address
    }
    try {
        const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
        const wallet = TwoFactorWallet.attach(address);
        return res.status(200).json({ account: await loadAccount(wallet.address) })    
    } catch(e: any) {
        return res.status(500).json({ e: JSON.stringify(e), message: e?.message })    
    }
}

const loadWallet = async (address: string) => {
    const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
    return TwoFactorWallet.attach(address);;
}

const loadRgfProvider = async (address: string) => {
    const TwoFactorWallet = await ethers.getContractFactory(RGF_MANUAL_CONTRACT_NAME);
    return TwoFactorWallet.attach(address);;
}

export const manualRGFProviderView = async (req: Request, res: Response, next: NextFunction) => {
    let { address }: any = req.query;
    const rgfProvider = await loadRgfProvider(address);
    const RGF = parseInt(ethers.utils.formatUnits(await rgfProvider.RGF(), 0));
    const RGFM = parseInt(ethers.utils.formatUnits(await rgfProvider.RGFM(), 0));
    const MIN_RGF = parseInt(ethers.utils.formatUnits(await rgfProvider.MIN_RGF(), 0));
    return res.status(200).json({ address, RGF, RGFM, MIN_RGF })
}


export const tx = async (req: Request, res: Response, next: NextFunction) => {

    let { hash }: any = req.query;

    // // TODO cheap deploy
    const [owner] = await ethers.getSigners();

    try {
        let tx = await owner.provider?.getTransaction(hash);
        return res.status(200).json({ tx });

    } catch(e: any) {
        // throw e;
        return res.status(200).json({ error: e?.message||JSON.stringify(e)});
    }
}

interface GasMarket {
    standard: string;
    fast: string;
    rapid: string;
    usdPrice: string;
}
let gasMarket: GasMarket|undefined;
const gasOracle = async () => {
    let URL = 'https://gpoly.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle';
    try {
        let res = await axios.get(URL);
        let data = res.data;
        if (data.message === 'OK') {
            let {SafeGasPrice: standard, ProposeGasPrice: fast, FastGasPrice: rapid, UsdPrice: usdPrice }: any = data?.result;
            gasMarket = { standard, fast, rapid, usdPrice };
        }    
    }catch{}
    setTimeout(gasOracle, 1000);
}
gasOracle();

// export default {
//     receipt,
//     getAccount,
//     signupTxStatus,
//     initTxStatus,
//     manualRGFProviderView,
//     gasMarketView
// };
