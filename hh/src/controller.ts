import { Request, Response, NextFunction } from 'express';
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { CONTRACT_DEPLOYER_NAME, CONTRACT_NAME, MIN_RGF, RGF, RGFM, RGF_MANUAL_CONTRACT_NAME } from './constants';
import ethWallet from'ethereumjs-wallet';
import { FeesAccount } from './models';

const DEPLOYER_ADDRESS = '0x143BFb3EE5990f0DF7d278fB638a82F37Bd6eab1';
const FEES_ACCOUNT = '0xBa9f4022841A32C1a5c4C4B8891fD4519Ca8E5dD';

interface SignupBody {
    address: string;
    cert: string;
    nonceSize: number;
    rgfProvider: string;
}

const signup = async (req: Request, res: Response, next: NextFunction) => {
    const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
    let wallet = await TwoFactorWallet.deploy();
    return res.status(200).json({ account: await loadAccount(wallet.address) })
}

const initAccount = async (req: Request, res: Response, next: NextFunction) => {

    let { address, cert, nonceSize }: SignupBody = req.body;
    const wallet = await loadWallet(address);    
    const ManualRGFProvider = await ethers.getContractFactory(RGF_MANUAL_CONTRACT_NAME);
    const RGFProvider = await ManualRGFProvider.deploy(wallet.address, RGF, RGFM, MIN_RGF);

    let walletAddress = address;

    let feesAccount: any = await FeesAccount.findOne({ where: { walletAddress } })
    if (!feesAccount) {
        let addressData = ethWallet.generate();
        console.log(`Private key = , ${addressData.getPrivateKeyString()}`);
        console.log(`Address = , ${addressData.getAddressString()}`);
        feesAccount = FeesAccount.build({
            address: addressData.getAddressString(),
            PK: addressData.getPrivateKeyString(),
            walletAddress
        });
        await feesAccount.save()
    }

    await wallet.init( '0x'+cert, nonceSize, RGFProvider.address);

    return res.status(200).json({ account: await loadAccount(wallet.address) })
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
    const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
    const wallet = await TwoFactorWallet.attach(address);
    return res.status(200).json({ account: await loadAccount(wallet.address) })
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

    const wallet = await loadWallet(address);
    let value = ethers.utils.parseEther(valueStr);
    const gweiValue = MIN_RGF;
    if (to) {
        let {txCert} = signTransactionAndProof({ to, data, value }, proof);
        if (data && data.startsWith('0x')) {
            data = data.substring(2);
        }
        console.log({ to, value, data, txCert })
    
        data = ethers.utils.toUtf8CodePoints(data);
        let recordTr = await wallet.call(to, value, data, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
        console.log({ recordTr })    
    }
    let tr = await wallet.expose('0x'+proof, 0);
    console.log({ tr });

    return res.status(200).json({ account: await loadAccount(address) })
}


const transactPreset = async (req: Request, res: Response, next: NextFunction) => {
    let { address, to, value: valueStr, data, txCert }: any = req.body;

    console.log({ address, to, valueStr });
    const wallet = await loadWallet(address);
    let value = ethers.utils.parseEther(valueStr);
    const gweiValue = MIN_RGF;
    let recordTr = await wallet.call(to, value, data, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
    console.log({ recordTr })    

    return res.status(200).json({ account: await loadAccount(address) })
}


const expose = async (req: Request, res: Response, next: NextFunction) => {
    let { address, proof }: any = req.body;
    const wallet = await loadWallet(address);
    let tr = await wallet.expose('0x'+proof, 0, { gasLimit: 500_000});
    console.log({ tr });
    return res.status(200).json({ account: await loadAccount(address) })
}


export default {
    signup,
    initAccount,
    getAccount,
    transact,
    transactPreset,
    expose,
};
