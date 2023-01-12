import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { ethers } from "hardhat";
import hre from "hardhat";
import { BigNumber } from "ethers";
import { CONTRACT_NAME, DEPOLYER_CONTRACT_NAME, RGF_MANUAL_CONTRACT_NAME } from '../constants';
import { CoinTransfer, FeesAccount, GasStop, NoneMatches, ResetCert, SCAA, sequelize, Skip, SyncStatus, TxDone, TxReverted } from '../models';
import { sha256 } from '../utils';
import { Op } from 'sequelize';
import { loadAccount } from './network';
import axios from 'axios';

const EMPTY_CERT = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const DEPLOYER_ADDRESS = fs.readFileSync('./deployments/localhost.txt').toString(); // localhost
const coins: any[] = JSON.parse(fs.readFileSync("./coins.json").toString());
const WalletlessDeployerABI: any[] = JSON.parse(fs.readFileSync("./abis/WalletlessDeployer.json").toString());
const WalletlessABI: any[] = JSON.parse(fs.readFileSync("./abis/Walletless.json").toString());

export const login = async (req: Request, res: Response) => {
    let {address: account, pp}: any = req.body;

    const [owner] = await ethers.getSigners();
    const provider = owner.provider;
    let wallet = await loadWallet(account);
    const state = await wallet.getState();
    console.log(state.cert);
    console.log({pp});
    console.log(ethers.utils.sha256('0x'+pp));
    if (ethers.utils.sha256('0x'+pp) === state.cert) {
        let feesAccount: any = await FeesAccount.findOne({ where: { SCAA: account } });
        let key = ethers.utils.sha256(feesAccount.PK||'0x');
        let balance = '0.0';
        if (provider) {
            balance = ethers.utils.formatEther(await provider.getBalance(feesAccount.address));
        }
        return res.status(200).json({
            gasProvider: {
                SCAA: feesAccount.SCAA,
                address: feesAccount.address,
                balance,
                key
            }, account: await loadAccount(account)
        });
    }
    return res.status(401).json({
        message: 'authentication failed'
    })
}

export const getCoins = async (req: Request, res: Response, next: NextFunction) => {
    const [owner] = await ethers.getSigners();

    const ERC20 = await ethers.getContractFactory('ERC20');
    let { address }: any = req.query;
    let balances = JSON.parse(JSON.stringify(coins));
    for (let balance of balances) {
        let amount = (await ERC20.attach(balance.address).balanceOf(address))||BigNumber.from('0');
        balance.balance = ethers.utils.formatEther(amount);
        console.log(balance.price);
        balance.usdValue = ethers.utils.formatEther(amount.mul(BigNumber.from(balance.price)));
    }
    balances.unshift({
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
        logo: "/icons/eth.svg",
        balance: ethers.utils.formatEther(await owner.provider?.getBalance(address)||'0'),
        usdValue: ethers.utils.formatEther((await owner.provider?.getBalance(address)||BigNumber.from('0')).mul(BigNumber.from(1200))),
    });

    return res.status(200).json({ balances });
}

export const createGasFeeAccount = async (req: Request, res: Response, next: NextFunction) => {

    const t = await sequelize.transaction();
    try {
        const next: any = await FeesAccount.findOne({
          where: {taken: { [Op.not]: true }}, transaction: t
        });

        next.taken = true;
        await next.save();

        let address = next.address;
        let PK = next.PK;
        let key = sha256(PK).digest('hex');
        let SCAA = next.SCAA;
        
        await t.commit();
        
        return res.status(200).json({ 
            provider: { address, key, balance: await balanceOf(address) },
            account: { address: SCAA, cert: EMPTY_CERT, balance: await balanceOf(SCAA) }
        });

    } catch (error: any) {
        await t.rollback();
        return res.status(500).json({ 
            error: error.message || JSON.stringify(error)
        });          
    }
};

export const history = async (req: Request, res: Response, next: NextFunction) => {
    const [owner] = await ethers.getSigners();
    let { address, key }: any = req.query;
    let activities: any[] = await CoinTransfer.findAll({where: {account: {[Op.or]: [address, address.toLowerCase()]}, value: {[Op.ne]: '0.0'}}});
    return res.status(200).json({ 
        activities
    });
}

const addEventName = (eventName: string, logs: any[]) => {
    for (let log of logs) {
        log['event'] = eventName
        console.log({log});
    }
    return logs;
}

export const activities = async (req: Request, res: Response, next: NextFunction) => {
    let { address, key }: any = req.query;
    let logs = addEventName('Skip', await Skip.findAll({ where: {account: address} }));
    logs = [...logs, ...addEventName('NoneMatches', await NoneMatches.findAll({ where: {account: address}, raw: true }))];
    logs = [...logs, ...addEventName('TxDone', await TxDone.findAll({ where: {account: address}, raw: true }))];
    logs = [...logs, ...addEventName('TxReverted', await TxReverted.findAll({ where: {account: address}, raw: true }))];
    logs = [...logs, ...addEventName('GasStop', await GasStop.findAll({ where: {account: address}, raw: true }))];
    logs = [...logs, ...addEventName('ResetCert', await ResetCert.findAll({ where: {account: address}, raw: true }))];

    return res.status(200).json({ 
        activities: logs
    });
}


export const getGasFeeAccount = async (req: Request, res: Response, next: NextFunction) => {
    const [owner] = await ethers.getSigners();
    let { address, key } = req.body;
    const feesAccount: any = await FeesAccount.findByPk(address);
    if (feesAccount) {
        if (ethers.utils.sha256(feesAccount.PK) === key) {
            return res.status(200).json({ provider:  {
                address, key, balance: await balanceOf(address), SCAA: feesAccount.SCAA
            }});
        } else if( feesAccount.SCAA ) {
            let scaa = await loadWallet(feesAccount.SCAA);
            let { cert } = await scaa.getState();
            if (sha256(key).digest('hex') === cert) {
                return res.status(200).json({ provider:  {
                    address, balance: await balanceOf(address), SCAA: feesAccount.SCAA
                }});
            }
        }
    }
    return res.status(400).json({ message: 'unauthorized'})
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

export const initAccount = async (req: Request, res: Response, next: NextFunction) => {

    const [owner] = await ethers.getSigners();
    let { address, cert, feesAddress }: SignupBody = req.body;
    let gasLimit = 1_500_000;
    let maxFeePerGas = getMaxFeePerGas();

    const Depolyer = await ethers.getContractFactory(DEPOLYER_CONTRACT_NAME);
    const deployer = Depolyer.attach(DEPLOYER_ADDRESS);

    let feesAccount: any = await FeesAccount.findOne({ where: { address: feesAddress } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    if (feesAccount.walletAddress && feesAccount.walletAddress !== address) {
        return res.status(500).json({ message: 'gas provider already has a wallet' });
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);
    let connect = deployer.connect(addr);
    let tx = await connect.initAccount(address, cert, { maxFeePerGas });
    return res.status(200).json({ tx });
}

const loadWallet = async (address: string) => {
    const SCAA = await ethers.getContractFactory(CONTRACT_NAME);
    console.log({address});
    return SCAA.attach(address);
}

const loadRgfProvider = async (address: string) => {
    const TwoFactorWallet = await ethers.getContractFactory(RGF_MANUAL_CONTRACT_NAME);
    return TwoFactorWallet.attach(address);;
}

const getMaxFeePerGas = () => {
    if (gasMarket) {
        return ethers.utils.parseUnits(gasMarket.standard, 9);
    }
    
}

export const transactPreset = async (req: Request, res: Response, next: NextFunction) => {
    let { address, to, value: valueStr, data, txCert }: any = req.body;
    if (data) {
        data = data.toLowerCase();
    }
    const [owner] = await ethers.getSigners();
    let feesAccount: any = await FeesAccount.findOne({ where: { SCAA: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);
    const wallet = await loadWallet(address);
    const state = await wallet.getState();
    let value = ethers.utils.parseEther(ethers.utils.formatEther(valueStr));
    let maxFeePerGas = getMaxFeePerGas();
    let rgfProviderAddress = state.rgfProvider;
    let rgfProvider = await loadRgfProvider(rgfProviderAddress);
    let fees = (await rgfProvider.get(data.length/2-1, state.presetCursor));
    let transaction = await wallet.connect(addr).preset(to, value, data, txCert, { value: fees, maxFeePerGas });
    return res.status(200).json({ transaction });
}

export const expose = async (req: Request, res: Response, next: NextFunction) => {
    let { address, proof, gasLimit }: any = req.body;
    gasLimit = gasLimit||3_500_000;
    let maxFeePerGas = getMaxFeePerGas();
    const [owner] = await ethers.getSigners();
    let feesAccount: any = await FeesAccount.findOne({ where: { SCAA: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);
    const wallet = await loadWallet(address);
    let transaction = await wallet.connect(addr).expose('0x'+proof, 0, { gasLimit, maxFeePerGas });
    console.log({ transaction });
    return res.status(200).json({ transaction });
}

export const exposeCont = async (req: Request, res: Response, next: NextFunction) => {
    let { address,gasLimit }: any = req.body;
    gasLimit = gasLimit||2_500_000;
    const [owner] = await ethers.getSigners();
    console.log({address});
    let feesAccount: any = await FeesAccount.findOne({ where: { SCAA: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);
    const wallet = await loadWallet(address);
    let maxFeePerGas = getMaxFeePerGas();
    let transaction = await wallet.connect(addr).exposeCont({gasLimit, maxFeePerGas});
    console.log({ transaction });
    return res.status(200).json({ transaction })
}

export const gasMarketView = async (req: Request, res: Response, next: NextFunction) => {
    console.log({gasMarket});
    return res.status(200).json({ gasMarket })
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
        return res.status(200).json({ tx: {hash, status} });
    } catch(e: any) {
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
let ORACLE_STORAGE = 'oracle.json';
const gasOracle = async () => {
    if (fs.existsSync(ORACLE_STORAGE)) {
        let rawdata: string = fs.readFileSync(ORACLE_STORAGE, {encoding: "utf8"});
        gasMarket = JSON.parse(rawdata);    
    }

    const API_KEY = '2PG8H86MBJRJJFTIM2KDS15I4HRQ486JBV';
    let URL = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${API_KEY}`;
    let PRICE_URL = `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${API_KEY}`;
    try {
        console.log(URL);
        let res = await axios.get(URL);
        let priceRes = await axios.get(PRICE_URL);
        let data = res.data;
        let priceData = priceRes.data;
        console.log({priceData})
        if (data.message === 'OK' && priceData.message === 'OK') {
            let { ethusd }: any = priceData.result;
            let usdPrice = ethusd;
            let {SafeGasPrice: standard, ProposeGasPrice: fast, FastGasPrice: rapid }: any = data?.result;
            gasMarket = { standard, fast, rapid,  usdPrice };
            let rawdata = JSON.stringify(gasMarket, null, 4);
            console.log(rawdata);
            fs.writeFileSync(ORACLE_STORAGE, rawdata);
        }
    } catch (e: any) {
        console.error(e);
    } finally {
        console.log({gasMarket});
        setTimeout(gasOracle, 60*1000);    
    }
}
gasOracle();
