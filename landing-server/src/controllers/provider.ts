import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { CONTRACT_NAME, DEPOLYER_CONTRACT_NAME, MIN_RGF, RGF, RGFM, RGF_MANUAL_CONTRACT_NAME } from '../constants';
import ethWallet from'ethereumjs-wallet';
import { FeesAccount } from '../models';
import axios from 'axios';
import { sha256 } from '../utils';


// export const DEPLOYER_ADDRESS = '0x9eBb49B2004C753f6Fb8b3181C224a8972f70528'; // aws
// export const DEPLOYER_ADDRESS = '0x932A101a6f276C53fb2e86b767DaeD8D213Ba27E'; // MATIC
export const DEPLOYER_ADDRESS = '0x3155755b79aA083bd953911C92705B7aA82a18F9'; // localhost

// let GWEI = 1000000000;
// let maxFeePerGas = ethers.BigNumber.from(40000000000) // fallback to 40 gwei
// let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000) // fallback to 40 gwei

export const createGasFeeAccount = async (req: Request, res: Response, next: NextFunction) => {
    let { } = req.body;
    let {address, key} = await generateNewWallet();
    return res.status(200).json({ 
        provider: {address, key, balance: await balanceOf(address)}
    })
};


export const getGasFeeAccount = async (req: Request, res: Response, next: NextFunction) => {
    const [owner] = await ethers.getSigners();
    let { address, key } = req.body;
    const feesAccount: any = await FeesAccount.findByPk(address);
    if (feesAccount) {
        if (sha256(feesAccount.PK).digest('hex') === key) {
            return res.status(200).json({ provider:  {
                address, key, balance: await balanceOf(address)
            }});
        } else if( feesAccount.walletAddress ) {
            let wallet = await loadWallet(feesAccount.walletAddress);
            let { cert } = await wallet.getState();
            if (sha256(key).digest('hex') === cert) {
                return res.status(200).json({ provider:  {
                    address, balance: await balanceOf(address)
                }});
            }
        }
    }
    return res.status(400).json({ message: 'unauthorized'})
}

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    let { feesAddress, key, gasLimit }: any = req.body;
    gasLimit = gasLimit||3_500_000;
    try {
        let feesAccount = await signinFeesAccount(feesAddress, key);
        let tx = await deploy(feesAccount.PK, { gasLimit, ...gasConfiguration() })
        let status = 'pending';
        if (tx.status === 1) {
            status = 'done';
        } else if (tx.status === 2) {
            status = 'failed';
        }
        return res.status(200).json({ tx: { hash: tx.hash, status } });
    } catch(e: any) {
        return res.status(200).json({ error: e?.message||JSON.stringify(e)});
    }
}



const generateNewWallet = async () => {
    let addressData = ethWallet.generate();
    let address = addressData.getAddressString();
    let PK = addressData.getPrivateKeyString();
    let key = sha256(PK).digest('hex');
    await FeesAccount.build({ address, PK }).save();
    return {address, PK, key}
}

const balanceOf = async (address: string): Promise<string> => {
    const [owner] = await ethers.getSigners();
    return ethers.utils.formatEther(await owner.provider?.getBalance(address)||'0')
}


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

const ethProvider = async () => {
    const [owner] = await ethers.getSigners();
    return owner.provider;
}

const deploy = async (PK: string, { gasLimit, maxFeePerGas, maxPriorityFeePerGas }: any) => {
    let addr = new ethers.Wallet(PK, await ethProvider());
    const Depolyer = await ethers.getContractFactory(DEPOLYER_CONTRACT_NAME);
    const deployer = Depolyer.attach(DEPLOYER_ADDRESS);    
    return await deployer.connect(addr).createAccount({ gasLimit, maxFeePerGas, maxPriorityFeePerGas });
}

const gasConfiguration = () => {
    let maxFeePerGas, maxPriorityFeePerGas;
    maxFeePerGas = maxPriorityFeePerGas = getMaxFeePerGas();
    return {maxFeePerGas, maxPriorityFeePerGas};
}

const signinFeesAccount = async (address: string, key: string) => {
    const feesAccount: any = await FeesAccount.findByPk(address);
    if (feesAccount) {
        if (sha256(feesAccount.PK).digest('hex') === key) {
            return feesAccount;
        } else if( feesAccount.walletAddress ) {
            let wallet = await loadWallet(feesAccount.walletAddress);
            let { cert } = await wallet.getState();
            if (sha256(key).digest('hex') === cert) {
                return feesAccount;
            }
        }
    }
    throw 'key authentication failed';
}


export const initAccount = async (req: Request, res: Response, next: NextFunction) => {

    const [owner] = await ethers.getSigners();
    let { address, cert, nonceSize, feesAddress }: SignupBody = req.body;
    let gasLimit = 2_500_000;

    const Depolyer = await ethers.getContractFactory(DEPOLYER_CONTRACT_NAME);
    const deployer = Depolyer.attach(DEPLOYER_ADDRESS);

    let feesAccount: any = await FeesAccount.findOne({ where: { address: feesAddress } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    if (feesAccount.walletAddress && feesAccount.walletAddress !== address) {
        return res.status(500).json({ message: 'gas provider already has a wallet' });
    }

    console.log({ feesAccount })
    console.log({ address })
    feesAccount.walletAddress = address;
    await feesAccount.save();

    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);

    let maxFeePerGas, maxPriorityFeePerGas;
    maxFeePerGas = maxPriorityFeePerGas = getMaxFeePerGas();
    console.log({ address, cert, RGF, RGFM, MIN_RGF, gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    // let tx = await deployer.connect(addr).initAcount(address, cert, nonceSize, RGF, RGFM, MIN_RGF, { gasLimit: 2_500_000, maxFeePerGas, maxPriorityFeePerGas });
    let tx = await deployer.connect(addr).initAcount(address, cert, RGF, RGFM, MIN_RGF, { gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    console.log({tx})
    return res.status(200).json({ tx });
}

const loadWallet = async (address: string) => {
    const SCAA = await ethers.getContractFactory(CONTRACT_NAME);
    return SCAA.attach(address);
}

const loadRgfProvider = async (address: string) => {
    const TwoFactorWallet = await ethers.getContractFactory(RGF_MANUAL_CONTRACT_NAME);
    return TwoFactorWallet.attach(address);;
}

const getMaxFeePerGas = () => {
    if (!gasMarket) {
        throw Error("oracle is not initiated yet");
    }
    return ethers.utils.parseUnits(gasMarket.rapid, 9);
}

const gasMethodToMaxFeePerGas = (gasMethod: string) => {
    if (!gasMarket) {
        throw Error("oracle is not initiated yet");
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

export const transactPreset = async (req: Request, res: Response, next: NextFunction) => {
    let { address, to, value: valueStr, data, txCert }: any = req.body;
    let gasLimit = 2_500_000+10*(data.length);

    console.log({ address, to, value: valueStr, data, txCert });
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

export const expose = async (req: Request, res: Response, next: NextFunction) => {
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


export const exposeCont = async (req: Request, res: Response, next: NextFunction) => {
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

export const gasMarketView = async (req: Request, res: Response, next: NextFunction) => {
    console.log({gasMarket});
    return res.status(200).json({ gasMarket })
}


const dataToAddress = (data: string) => {
    return '0x'+data.substring(26);
}

export const signupTxStatus = async (req: Request, res: Response, next: NextFunction) => {

    let { hash }: any = req.query;
    let status = 'pending';
    let account: any;
    const [owner] = await ethers.getSigners();
    try {
        let receipt = await owner.provider?.getTransactionReceipt(hash);
        if (!receipt) {
            status = 'failed';
        }
        else {
            if (receipt?.status === 0) {
                status = 'failed';
            } else if (receipt?.status === 1) {
                status = 'done';
            }
            console.log({receipt})
            let [{data}] = receipt?.logs||[];
            let walletAddress = dataToAddress(data);
            account = await loadAccount(walletAddress);    
        }
        return res.status(200).json({ tx: {hash, status}, account });
    } catch(e: any) {
        throw e;
        return res.status(200).json({ error: e?.message||JSON.stringify(e)});
    }
}



export const initTxStatus = async (req: Request, res: Response, next: NextFunction) => {
    let { hash }: any = req.query;
    const [owner] = await ethers.getSigners();
    try {
        let receipt = await owner.provider?.getTransactionReceipt(hash);
        let status = 'pending';
        if (receipt?.status === 0) {
            status = 'failed';
        } else if (receipt?.status === 1) {
            status = 'done';
        }
        
        console.log({ receipt });
        console.log({status});
        return res.status(200).json({ tx: {hash, status} });
    } catch(e: any) {
        return res.status(200).json({ error: e?.message||JSON.stringify(e)});
    }
}


const loadAccount = async (address: string, rgfDetailed: boolean=false) => {

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
    const wallet = TwoFactorWallet.attach(address);

    let feesAccount: any = await FeesAccount.findOne({ where: { walletAddress: address } })
    // let feesAccountAddress = feesAccount?.address||FEES_ACCOUNT;
    let { cert, nonce, active: isActive, pending: pendingArr, pendingCounter,
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
        balance: ethers.utils.formatEther(await owner.provider?.getBalance(address)||'0'),
        // feesAccount: feesAccount?.address||FEES_ACCOUNT,
        // gasFeesBalance: ethers.utils.formatEther(await owner.provider?.getBalance(feesAccountAddress)||'0'),
        isActive, pending, pendingCounter,
        pendingAttackCounter: parseInt(ethers.utils.formatUnits(pendingAttackCounter, 0)), txProcessing, processingCursor,
        rgfProvider
    }

    return account;
}



interface GasMarket {
    standard: string;
    fast: string;
    rapid: string;
    usdPrice: string;
}
let gasMarket: GasMarket|undefined;
let ORACLE_STORAGE = 'oracle.json';
const gasOracle = async () => {
    if (fs.existsSync(ORACLE_STORAGE)) {
        let rawdata: string = fs.readFileSync(ORACLE_STORAGE, {encoding: "utf8"});
        gasMarket = JSON.parse(rawdata);    
    }
    let URL = 'https://gpoly.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle';
    try {
        let res = await axios.get(URL);
        let data = res.data;
        if (data.message === 'OK') {
            let {SafeGasPrice: standard, ProposeGasPrice: fast, FastGasPrice: rapid, UsdPrice: usdPrice }: any = data?.result;
            gasMarket = { standard, fast, rapid, usdPrice };
            let rawdata = JSON.stringify(gasMarket, null, 4);
            // fs.writeFileSync(ORACLE_STORAGE, rawdata);
        }
    }catch (e: any) {
        console.error(e);
    }
    console.log({gasMarket});
    setTimeout(gasOracle, 10000);
}
gasOracle();
