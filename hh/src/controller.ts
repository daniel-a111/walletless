import { Request, Response, NextFunction } from 'express';
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { CONTRACT_NAME, DEPOLYER_CONTRACT_NAME, MIN_RGF, RGF, RGFM, RGF_MANUAL_CONTRACT_NAME } from './constants';
import ethWallet from'ethereumjs-wallet';
import { FeesAccount } from './models';

const DEPLOYER_ADDRESS = '0x948B3c65b89DF0B4894ABE91E6D02FE579834F8F';
const FEES_ACCOUNT = '0xBa9f4022841A32C1a5c4C4B8891fD4519Ca8E5dD';

interface SignupBody {
    address: string;
    cert: string;
    nonceSize: number;
    rgfProvider: string;
    feesAddress?: string;
}

const dataToAddress = (data: string) => {
    return '0x'+data.substring(26);
}

const signup = async (req: Request, res: Response, next: NextFunction) => {

    let { feesAddress }: any = req.body;

    // TODO cheap deploy
    const [owner] = await ethers.getSigners();
    const Depolyer = await ethers.getContractFactory(DEPOLYER_CONTRACT_NAME);
    const deployer = await Depolyer.attach(DEPLOYER_ADDRESS);

    try {
        const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
        let feesAccount: any = await FeesAccount.findOne({ where: { address: feesAddress } });
        if (!feesAccount) {
            return res.status(500).json({ message: 'fee account missing or dont have balance' })
        }
        let addr = new ethers.Wallet(feesAccount.PK, owner.provider);
        let walletAddress = await deployer.connect(addr).callStatic.createAccount();
        let tr = await deployer.connect(addr).createAccount();
        let receipt = await owner.provider?.getTransactionReceipt(tr.hash);
        let [{data}] = receipt?.logs||[];
        walletAddress = dataToAddress(data);
        let wallet = TwoFactorWallet.attach(walletAddress);
        feesAccount.walletAddress = wallet.address;
        await feesAccount.save();
        return res.status(200).json({ account: { address: wallet.address } });
    } catch(e: any) {
        return res.status(200).json({ error: e?.message||JSON.stringify(e)});
    }
}

const initAccount = async (req: Request, res: Response, next: NextFunction) => {

    const [owner] = await ethers.getSigners();
    let { address, cert, nonceSize, feesAddress }: SignupBody = req.body;
    const wallet = await loadWallet(address);    
    const ManualRGFProvider = await ethers.getContractFactory(RGF_MANUAL_CONTRACT_NAME);
    const RGFProvider = await ManualRGFProvider.deploy(wallet.address, RGF, RGFM, MIN_RGF);
    console.log({a: RGFProvider.address})

    let walletAddress = address;

    let feesAccount: any;
    if (feesAddress) {
        feesAccount = await FeesAccount.findOne({ where: { address: feesAddress } });
    } else {
        feesAccount = await FeesAccount.findOne({ where: { walletAddress } });
    }
    if (!feesAccount) {
        let addressData = ethWallet.generate();
        console.log(`Private key = , ${addressData.getPrivateKeyString()}`);
        console.log(`Address = , ${addressData.getAddressString()}`);
        feesAccount = FeesAccount.build({
            address: addressData.getAddressString(),
            PK: addressData.getPrivateKeyString(),
        });
    }
    feesAccount.walletAddress = walletAddress;
    await feesAccount.save()

    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);
    let tr = await wallet.connect(addr).init( '0x'+cert, nonceSize, RGFProvider.address, { gasLimit: 500_000 });
    console.log(tr);
    return res.status(200).json({ account: await loadAccount(wallet.address) })
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

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
    const wallet = await TwoFactorWallet.attach(address);

    const RGFProviderAddress = await wallet.rgfProvider();
    const ManualRGFProvider = await ethers.getContractFactory(RGF_MANUAL_CONTRACT_NAME);
    const RGFProvider = await ManualRGFProvider.attach(RGFProviderAddress);

    // let addressData = ethWallet.generate();
    // console.log(`Private key = , ${addressData.getPrivateKeyString()}`);
    // console.log(`Address = , ${addressData.getAddressString()}`);

    // let feesAccount = FeesAccount.build({ address: addressData.getAddressString(), PK: addressData.getPrivateKeyString() });
    // await feesAccount.save();
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
        const wallet = await TwoFactorWallet.attach(address);
        return res.status(200).json({ account: await loadAccount(wallet.address) })    
    } catch(e: any) {
        return res.status(500).json({ e: JSON.stringify(e), message: e?.message })    
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
const loadWallet = async (address: string) => {
    const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
    return await TwoFactorWallet.attach(address);;
}

const transact = async (req: Request, res: Response, next: NextFunction) => {
    let { address, to, value: valueStr, data, proof }: any = req.body;

    const [owner] = await ethers.getSigners();
    let feesAccount: any = await FeesAccount.findOne({ where: { walletAddress: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);

    const wallet = await loadWallet(address);
    let value = ethers.utils.parseEther(valueStr);
    const gweiValue = MIN_RGF;
    if (to) {
        let {txCert} = signTransactionAndProof({ to, data, value }, proof);
        let recordTr = await wallet.connect(addr).call(to, value, data, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
        console.log({ recordTr })    
    }
    let tr = await wallet.connect(addr).expose('0x'+proof, 0, { gasLimit: 500_000});
    console.log({ tr });

    return res.status(200).json({ account: await loadAccount(address) })
}


const transactPreset = async (req: Request, res: Response, next: NextFunction) => {
    let { address, to, value: valueStr, data, txCert }: any = req.body;

    const [owner] = await ethers.getSigners();
    let feesAccount: any = await FeesAccount.findOne({ where: { walletAddress: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);

    console.log({ address, to, valueStr });
    const wallet = await loadWallet(address);
    let value = ethers.utils.parseEther(valueStr);
    const gweiValue = MIN_RGF;
    let recordTr = await wallet.connect(addr).call(to, value, data, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
    console.log({ recordTr })    

    return res.status(200).json({ account: await loadAccount(address) })
}


const expose = async (req: Request, res: Response, next: NextFunction) => {
    let { address, proof }: any = req.body;

    const [owner] = await ethers.getSigners();
    let feesAccount: any = await FeesAccount.findOne({ where: { walletAddress: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);

    const wallet = await loadWallet(address);
    let tr = await wallet.connect(addr).expose('0x'+proof, 0, { gasLimit: 500_000});
    console.log({ tr });
    return res.status(200).json({ account: await loadAccount(address) })
}


export default {
    signup,
    getGasFeeAccount,
    initAccount,
    getAccount,
    transact,
    transactPreset,
    expose,
};
