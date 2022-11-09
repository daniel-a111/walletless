import { Request, Response, NextFunction } from 'express';
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { CONTRACT_NAME, DEPOLYER_CONTRACT_NAME, MIN_RGF, RGF, RGFM, RGF_MANUAL_CONTRACT_NAME } from './constants';
import ethWallet from'ethereumjs-wallet';
import { FeesAccount } from './models';
import axios from 'axios';

// export const DEPLOYER_ADDRESS = '0x9eBb49B2004C753f6Fb8b3181C224a8972f70528'; // aws
export const DEPLOYER_ADDRESS = '0x932A101a6f276C53fb2e86b767DaeD8D213Ba27E'; // MATIC
// export const DEPLOYER_ADDRESS = '0x95bD8D42f30351685e96C62EDdc0d0613bf9a87A'; // localhost
const FEES_ACCOUNT = '0xBa9f4022841A32C1a5c4C4B8891fD4519Ca8E5dD';

// let GWEI = 1000000000;
// let maxFeePerGas = ethers.BigNumber.from(40000000000) // fallback to 40 gwei
// let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000) // fallback to 40 gwei

interface SignupBody {
    address: string;
    cert: string;
    nonceSize: number;
    rgfProvider: string;
    feesAddress?: string;
    gasLimit?: number,
    maxFeePerGas?: number;
    maxPriorityFeePerGas?: number;
}

const dataToAddress = (data: string) => {
    return '0x'+data.substring(26);
}

const signupTxStatus = async (req: Request, res: Response, next: NextFunction) => {

    let { hash }: any = req.query;

    const [owner] = await ethers.getSigners();
    try {

        let receipt = await owner.provider?.getTransactionReceipt(hash);
        if (!receipt) {
            return res.status(200).json({ status: -1 });
        }
        if (receipt.status === 0) {
            return res.status(200).json({ status: 0 });
        }
        if (!receipt?.logs || receipt.logs.length === 0) {
            return res.status(500).json({ status: receipt.status, accountAddress: null });
        }
        let [{data}] = receipt?.logs||[];
        let walletAddress = dataToAddress(data);
        let wallet = await loadWallet(walletAddress)
        return res.status(200).json({ success: true, done: true, account: { address: wallet.address } });
    } catch(e: any) {
        // throw e;
        return res.status(200).json({ error: e?.message||JSON.stringify(e)});
    }
}

const initTxStatus = async (req: Request, res: Response, next: NextFunction) => {
    let { hash }: any = req.query;
    // // TODO cheap deploy
    const [owner] = await ethers.getSigners();
    try {
        console.log({hash});
        let receipt = await owner.provider?.getTransactionReceipt(hash);
        console.log({ receipt });
        return res.status(200).json({ success: true });
    } catch(e: any) {
        // throw e;
        return res.status(200).json({ error: e?.message||JSON.stringify(e)});
    }
}



const receipt = async (req: Request, res: Response, next: NextFunction) => {

    let { hash }: any = req.query;

    // // TODO cheap deploy
    const [owner] = await ethers.getSigners();
    try {
        let receipt = await owner.provider?.getTransactionReceipt(hash);
        return res.status(200).json({ receipt });
    } catch(e: any) {
        // throw e;
        return res.status(200).json({ error: e?.message||JSON.stringify(e)});
    }
}


const tx = async (req: Request, res: Response, next: NextFunction) => {

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

const signup = async (req: Request, res: Response, next: NextFunction) => {

    let { feesAddress, gasLimit }: any = req.body;
    gasLimit = gasLimit||3_500_000;

    // TODO cheap deploy
    const [owner] = await ethers.getSigners();
    const Depolyer = await ethers.getContractFactory(DEPOLYER_CONTRACT_NAME);
    const deployer = Depolyer.attach(DEPLOYER_ADDRESS);

    try {
        let feesAccount: any = await FeesAccount.findOne({ where: { address: feesAddress } });
        if (!feesAccount) {
            return res.status(500).json({ message: 'fee account missing or dont have balance' })
        }
        let addr = new ethers.Wallet(feesAccount.PK, owner.provider);
        let maxFeePerGas, maxPriorityFeePerGas;
        maxFeePerGas = maxPriorityFeePerGas = getMaxFeePerGas();
        console.log(addr.address);
        let tx = await deployer.connect(addr).createAccount({ gasLimit, maxFeePerGas, maxPriorityFeePerGas });
        return res.status(200).json({ tx });
    } catch(e: any) {
        // throw e;
        return res.status(200).json({ error: e?.message||JSON.stringify(e)});
    }
}

const initAccount = async (req: Request, res: Response, next: NextFunction) => {

    const [owner] = await ethers.getSigners();
    let { address, cert, nonceSize, feesAddress }: SignupBody = req.body;
    let gasLimit = 2_500_000;

    const Depolyer = await ethers.getContractFactory(DEPOLYER_CONTRACT_NAME);
    const deployer = Depolyer.attach(DEPLOYER_ADDRESS);

    let feesAccount: any = await FeesAccount.findOne({ where: { address: feesAddress } });
    if (!feesAccount) {
        let addressData = ethWallet.generate();
        console.log(`Private key = , ${addressData.getPrivateKeyString()}`);
        console.log(`Address = , ${addressData.getAddressString()}`);
        feesAccount = FeesAccount.build({
            address: addressData.getAddressString(),
            PK: addressData.getPrivateKeyString(),
        });
    }
    feesAccount.walletAddress = address;
    await feesAccount.save()
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);

    let maxFeePerGas, maxPriorityFeePerGas;
    maxFeePerGas = maxPriorityFeePerGas = getMaxFeePerGas();
    // let tx = await deployer.connect(addr).initAcount(address, cert, nonceSize, RGF, RGFM, MIN_RGF, { gasLimit: 2_500_000, maxFeePerGas, maxPriorityFeePerGas });
    let tx = await deployer.connect(addr).initAcount(address, cert, nonceSize, RGF, RGFM, MIN_RGF, { gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    return res.status(200).json({ tx });
}

const getGasFeeAccount = async (req: Request, res: Response, next: NextFunction) => {
    const [owner] = await ethers.getSigners();
    let { address } = req.body;
    if (!address) {
        let addressData = ethWallet.generate();
        console.log(`Private key = , ${addressData.getPrivateKeyString()}`);
        console.log(`Address = , ${addressData.getAddressString()}`);
        let feesAccount: any = FeesAccount.build({
            address: addressData.getAddressString(),
            PK: addressData.getPrivateKeyString(),
        });
        await feesAccount.save();
        return res.status(200).json({ feesAccount: feesAccount.address, balance: ethers.utils.formatEther(await owner.provider?.getBalance(feesAccount.address)||'0')})
    } else {
        return res.status(200).json({ feesAccount: address, balance: ethers.utils.formatEther(await owner.provider?.getBalance(address)||'0.0')})
    }
}

const loadAccount = async (address: string, rgfDetailed: boolean=false) => {

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
    const wallet = TwoFactorWallet.attach(address);

    let feesAccount: any = await FeesAccount.findOne({ where: { walletAddress: address } })
    let feesAccountAddress = feesAccount?.address||FEES_ACCOUNT;
    let { cert, nonceSize, nonce, active: isActive, pending: pendingArr, pendingCounter,
        pendingAttackCounter, txProcessing, processingCursor, rgfProvider } = await wallet.getState();
    let pending: any[] = [];
    for (let i = 0; i < pendingArr.length; i++) {
        let { to, value, data, cert } = pendingArr[i];
        pending.push({ to, value: ethers.utils.formatEther(value), data, cert });
    }

    // let ethBalance = await owner.provider?.getBalance(address);
    // let usdBalance = ethBalance?.mul(BigNumber.from(ma))

    let account: any = {
        address,
        cert,
        nonce: parseInt(ethers.utils.formatUnits(nonce, 0)),
        nonceSize: parseInt(ethers.utils.formatUnits(nonceSize, 0)),
        balance: ethers.utils.formatEther(await owner.provider?.getBalance(address)||'0'),
        feesAccount: feesAccount?.address||FEES_ACCOUNT,
        gasFeesBalance: ethers.utils.formatEther(await owner.provider?.getBalance(feesAccountAddress)||'0'),
        isActive, pending, pendingCounter,
        pendingAttackCounter: parseInt(ethers.utils.formatUnits(pendingAttackCounter, 0)), txProcessing, processingCursor,
        rgfProvider
    }

    return account;
}


const getAccount = async (req: Request, res: Response, next: NextFunction) => {
    let { address }: any = req.query;
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

const getMaxFeePerGas = () => {
    if (!gasMarket) {
        throw Error("oracke is not initiated yet");
    }
    return ethers.utils.parseUnits(gasMarket.rapid, 9);
}

const gasMethodToMaxFeePerGas = (gasMethod: string) => {
    if (!gasMarket) {
        throw Error("oracke is not initiated yet");
    }
    if (gasMethod === 'standard') {
        return BigNumber.from(gasMarket?.standard);
    } else if (gasMethod === 'fast') {
        return BigNumber.from(gasMarket?.fast);
    } else if (gasMethod === 'rapid') {
        return BigNumber.from(gasMarket?.rapid);
    } else {
        throw Error("Gas Method must be chosen");
    }
}

const transactPreset = async (req: Request, res: Response, next: NextFunction) => {
    let { address, to, value: valueStr, data, txCert }: any = req.body;
    let gasLimit = 2_500_000+10*(data.length);

    const [owner] = await ethers.getSigners();
    let feesAccount: any = await FeesAccount.findOne({ where: { walletAddress: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);
    const wallet = await loadWallet(address);
    const state = await wallet.getState();
    let value = ethers.utils.parseEther(valueStr);

    let maxFeePerGas = getMaxFeePerGas();
    let maxPriorityFeePerGas = maxFeePerGas;

    let rgfProviderAddress = state.rgfProvider;
    let rgfProvider = await loadRgfProvider(rgfProviderAddress);
    let fees = (await rgfProvider.getManual(data.length/2-1, state.pendingAttackCounter, maxFeePerGas));
    console.log({ fees })

    let nonce = await wallet.provider.getTransactionCount(addr.address);
    let transaction = await wallet.connect(addr).call(to, value, data, txCert, { nonce, value: fees, gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    console.log(await wallet.provider.getTransactionCount(addr.address));
    // let transaction = {};
    console.log({ transaction });

    return res.status(200).json({ transaction });
}

const expose = async (req: Request, res: Response, next: NextFunction) => {
    let { address, proof, gasLimit }: any = req.body;
    gasLimit = gasLimit||2_500_000;
    let maxFeePerGas = getMaxFeePerGas();
    let maxPriorityFeePerGas = maxFeePerGas;

    const [owner] = await ethers.getSigners();
    let feesAccount: any = await FeesAccount.findOne({ where: { walletAddress: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);

    const wallet = await loadWallet(address);
    let nonce = await wallet.provider.getTransactionCount(addr.address);
    let transaction = await wallet.connect(addr).expose('0x'+proof, 0, { nonce, gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    console.log({ transaction });
    return res.status(200).json({ transaction });
}


const exposeCont = async (req: Request, res: Response, next: NextFunction) => {
    let { address,gasLimit }: any = req.body;
    gasLimit = gasLimit||2_500_000;

    const [owner] = await ethers.getSigners();
    let feesAccount: any = await FeesAccount.findOne({ where: { walletAddress: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);

    const wallet = await loadWallet(address);
    let nonce = await wallet.provider.getTransactionCount(addr.address);
    let maxFeePerGas = getMaxFeePerGas();
    let maxPriorityFeePerGas = maxFeePerGas;
    let transaction = await wallet.connect(addr).exposeCont({ nonce, gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    console.log({ transaction });
    return res.status(200).json({ transaction })
}

const manualRGFProviderView = async (req: Request, res: Response, next: NextFunction) => {
    let { address }: any = req.query;
    const rgfProvider = await loadRgfProvider(address);
    const RGF = parseInt(ethers.utils.formatUnits(await rgfProvider.RGF(), 0));
    const RGFM = parseInt(ethers.utils.formatUnits(await rgfProvider.RGFM(), 0));
    const MIN_RGF = parseInt(ethers.utils.formatUnits(await rgfProvider.MIN_RGF(), 0));
    return res.status(200).json({ address, RGF, RGFM, MIN_RGF })
}

const gasMarketView = async (req: Request, res: Response, next: NextFunction) => {
    console.log({gasMarket});
    return res.status(200).json({ gasMarket })
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
    let res = await axios.get(URL);
    let data = res.data;
    if (data.message === 'OK') {
        // console.log({data});
        let {SafeGasPrice: standard, ProposeGasPrice: fast, FastGasPrice: rapid, UsdPrice: usdPrice }: any = data?.result;
        gasMarket = { standard, fast, rapid, usdPrice };
    }
    setTimeout(gasOracle, 1000);
}
gasOracle();

export default {
    receipt,
    tx,
    signup,
    getGasFeeAccount,
    initAccount,
    getAccount,
    transactPreset,
    expose,
    exposeCont,
    signupTxStatus,
    initTxStatus,
    manualRGFProviderView,
    gasMarketView
};
