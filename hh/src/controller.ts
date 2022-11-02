import { Request, Response, NextFunction } from 'express';
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { CONTRACT_NAME, DEPOLYER_CONTRACT_NAME, MIN_RGF, RGF, RGFM, RGF_MANUAL_CONTRACT_NAME } from './constants';
import ethWallet from'ethereumjs-wallet';
import { FeesAccount } from './models';

export const DEPLOYER_ADDRESS = '0x1AC4Bd4fcb3Cfc77eB176c710f422994C5E58171'; // aws
// export const DEPLOYER_ADDRESS = '0xf560A1a820EdC6D23E813A17C100a2C6b2FF41b2'; // MATIC
// export const DEPLOYER_ADDRESS = '0x9A676e781A523b5d0C0e43731313A708CB607508'; // localhost
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
        if (!receipt?.logs || receipt.logs.length === 0) {
            return res.status(500).json({ message: 'no logs' })
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

    let { feesAddress, gasLimit, maxFeePerGas, maxPriorityFeePerGas }: any = req.body;
    gasLimit = 3_500_000;
    maxFeePerGas = BigNumber.from(maxFeePerGas);
    maxPriorityFeePerGas = BigNumber.from(maxPriorityFeePerGas);

    console.log({ m: maxFeePerGas.mul(BigNumber.from(gasLimit)), maxFeePerGas, maxPriorityFeePerGas })

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
        console.log({ feesAddress });
        // let tx = await deployer.connect(addr).createAccount({ gasLimit: 2_500_000, maxFeePerGas, maxPriorityFeePerGas });
        let tx = await deployer.connect(addr).createAccount({ gasLimit, maxFeePerGas, maxPriorityFeePerGas });
        return res.status(200).json({ tx });
    } catch(e: any) {
        // throw e;
        return res.status(200).json({ error: e?.message||JSON.stringify(e)});
    }
}

const initAccount = async (req: Request, res: Response, next: NextFunction) => {

    const [owner] = await ethers.getSigners();
    let { address, cert, nonceSize, feesAddress, gasLimit, maxFeePerGas, maxPriorityFeePerGas }: SignupBody = req.body;
    gasLimit = gasLimit||2_500_000;

    // const wallet = await loadWallet(address);
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
        return res.status(200).json({ feesAccount: feesAccount.address, balance: await owner.provider?.getBalance(feesAccount.address)||'0'})
    } else {
        return res.status(200).json({ feesAccount: address, balance: ethers.utils.formatEther(await owner.provider?.getBalance(address)||'0.0')})

    }
}

const loadAccount = async (address: string) => {

    console.log({address})
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
    const wallet = TwoFactorWallet.attach(address);

    let feesAccount: any = await FeesAccount.findOne({ where: { walletAddress: address } })
    let feesAccountAddress = feesAccount?.address||FEES_ACCOUNT;
    let isActive = await wallet.active();
    let account: any = {
        address,
        cert: isActive?(await wallet.cert()).substring(2):'',
        nonce: parseInt(ethers.utils.formatUnits(await wallet.nonce(), 0)),
        nonceSize: parseInt(ethers.utils.formatUnits(await wallet.nonceSize(), 0)),
        balance: ethers.utils.formatEther(await owner.provider?.getBalance(address)||'0'),
        feesAccount: feesAccount?.address||FEES_ACCOUNT,
        gasFeesBalance: ethers.utils.formatEther(await owner.provider?.getBalance(feesAccountAddress)||'0'),
    }

    try {
        if (isActive) {
            const RGFProviderAddress = await wallet.rgfProvider();
            const ManualRGFProvider = await ethers.getContractFactory(RGF_MANUAL_CONTRACT_NAME);
            const RGFProvider = ManualRGFProvider.attach(RGFProviderAddress);
            account.RGFProvider = {
                address: RGFProviderAddress,
                RGF: parseInt(ethers.utils.formatUnits(await RGFProvider.RGF(), 0)),
                RGFM: parseInt(ethers.utils.formatUnits(await RGFProvider.RGFM(), 0)),
                MIN_RGF: parseInt(ethers.utils.formatUnits(await RGFProvider.MIN_RGF(), 0)),
            };
        }
    } catch (e: any){}
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

const transactPreset = async (req: Request, res: Response, next: NextFunction) => {
    let { address, to, value: valueStr, data, txCert, gasLimit, maxFeePerGas, maxPriorityFeePerGas }: any = req.body;
    gasLimit = gasLimit||2_500_000;
    const [owner] = await ethers.getSigners();
    let feesAccount: any = await FeesAccount.findOne({ where: { walletAddress: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);
    const wallet = await loadWallet(address);
    let value = ethers.utils.parseEther(valueStr);

    const gweiValue = MIN_RGF;
    // let fees = gweiValue.mul(BigNumber.from(RGFM));
    let rgfProviderAddress = await wallet.rgfProvider();
    let rgfProvider = await loadRgfProvider(rgfProviderAddress);
    let fees = (await rgfProvider.get(data.length)).mul(100);
    console.log({ fees })
    // let transaction = await wallet.connect(addr).call(to, value, data, txCert, { value: fees, gasLimit: 2_500_000, maxFeePerGas, maxPriorityFeePerGas });
    let transaction = await wallet.connect(addr).call(to, value, data, txCert, { value: fees, gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    console.log({ transaction });

    return res.status(200).json({ transaction });
}

const expose = async (req: Request, res: Response, next: NextFunction) => {
    let { address, proof, gasLimit, maxFeePerGas, maxPriorityFeePerGas }: any = req.body;
    gasLimit = gasLimit||2_500_000;
    const [owner] = await ethers.getSigners();
    let feesAccount: any = await FeesAccount.findOne({ where: { walletAddress: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);

    const wallet = await loadWallet(address);
    let transaction = await wallet.connect(addr).expose('0x'+proof, 0, { gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    console.log({ transaction });
    return res.status(200).json({ transaction });
}


const exposeCont = async (req: Request, res: Response, next: NextFunction) => {
    let { address,gasLimit, maxFeePerGas, maxPriorityFeePerGas }: any = req.body;
    gasLimit = gasLimit||2_500_000;

    const [owner] = await ethers.getSigners();
    let feesAccount: any = await FeesAccount.findOne({ where: { walletAddress: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);

    const wallet = await loadWallet(address);
    let transaction = await wallet.connect(addr).exposeCont({ gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    console.log({ transaction });
    return res.status(200).json({ transaction })
}

const pendingView = async (req: Request, res: Response, next: NextFunction) => {
    let { address }: any = req.query;

    console.log({address})
    const wallet = await loadWallet(address);
    let pendingCounter = await wallet.pendingCounter();
    let txProcessing = await wallet.txProcessing();
    let processingCursor = await wallet.processingCursor();
    let pending = [];
    for (let i = 0; i < pendingCounter; i++) {
        let [to, value, data, cert] = await wallet.pending(i);
        pending.push({ idx: i, to, value: ethers.utils.formatEther(value), data, cert });
    }
    return res.status(200).json({ pendingCounter, pending, txProcessing, processingCursor })
}

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
    pendingView
};
