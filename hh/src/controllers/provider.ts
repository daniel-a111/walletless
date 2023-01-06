import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { ethers } from "hardhat";
import hre from "hardhat";
import { BigNumber } from "ethers";
import { CONTRACT_NAME, DEPOLYER_CONTRACT_NAME, RGF_MANUAL_CONTRACT_NAME } from '../constants';
import { CoinTransfer, FeesAccount, SCAA, sequelize, SyncStatus } from '../models';
import { sha256 } from '../utils';
import { Op } from 'sequelize';
import axios from 'axios';
import { provider } from '.';


const EMPTY_CERT = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const DEPLOYER_ADDRESS = fs.readFileSync('./deployments/localhost.txt').toString(); // localhost
const coins: any[] = JSON.parse(fs.readFileSync("./coins.json").toString());
const WalletlessDeployerABI: any[] = JSON.parse(fs.readFileSync("./abis/WalletlessDeployer.json").toString());
const WalletlessABI: any[] = JSON.parse(fs.readFileSync("./abis/Walletless.json").toString());

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

let deployerAbi = [
    "event ScaaCreated(Walletless account, address initializer)",
];



export const syncAllSCAA = async (req: Request, res: Response, next: NextFunction) => {
    const [owner] = await ethers.getSigners();
    let provider = owner.provider;
    console.log({DEPLOYER_ADDRESS})
    const contract = new ethers.Contract(
        ethers.utils.getAddress(DEPLOYER_ADDRESS),
        WalletlessDeployerABI,
        provider
    );
    let logs = await contract.queryFilter(contract.filters.ScaaCreated())
    for (let log of logs) {
        let {account, initializer}: any = log.args;
        let scaa = await SCAA.findByPk(account);
        if (!scaa) {
            let {timestamp}: any = await provider?.getBlock(log.blockNumber);
            scaa = SCAA.build({
                address: account,
                deployTime: new Date(timestamp*1000)
            });
            await scaa.save();
        }
    }
    return res.status(200).json({ 
        logs, DEPLOYER_ADDRESS
    });
}

interface Transfer {
    address: string;
    value: string;
    symbol: string;
}
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

export const syncAllData = async (req: Request, res: Response, next: NextFunction) => {

    let sync: any = await SyncStatus.findOne();
    if (!sync) {
        sync = SyncStatus.build({blockNumber: -1});
    }

    const [owner] = await ethers.getSigners();
    let provider = owner.provider;
    const contract = new ethers.Contract(
        ethers.utils.getAddress(DEPLOYER_ADDRESS),
        deployerAbi,
        provider
    );
    
    let SCAAs = new Set<string>();
    let feesAccounts: any[] = await FeesAccount.findAll();
    for (let feesAccount of feesAccounts) {
        SCAAs.add(feesAccount.SCAA);
    }

    let currentBlockNumber: number = await provider?.getBlockNumber()||-1;
    console.log({currentBlockNumber})
    while (sync.blockNumber < currentBlockNumber) {
        console.log(`fetch block ${sync.blockNumber+1}`);
        let block: any = await provider?.getBlockWithTransactions(sync.blockNumber+1);
        console.log({block: block.number})
        for (let transaction of block?.transactions || []) {
            console.log(transaction);
            let receipt = await owner.provider?.getTransactionReceipt(transaction.hash);
            console.log({receipt});
            try {
                const trace = await hre.network.provider.send("debug_traceTransaction", [
                    '0x42c498b065b953e5c672ab600d82c221da6e48f8750c0b432527e1edfe928fc3',
                    {
                      disableMemory: false,
                      disableStorage: false,
                      disableStack: false,
                      tracer: "callTracer"
                    },
                  ]);
                  console.log({trace})
                //   process.exit();
                let balanceChanges: any = {};
                balanceChanges[transaction.to] = transaction.value;
                balanceChanges[transaction.from] = BigNumber.from(0).sub(transaction.value);
                let erc20BalanceChanges: any = {};
                let currentContractAddress: string = transaction.to;
                for (let op of trace.structLogs) {
                    let stack = op.stack;
                    if (op.op === 'CALL' || op.call === 'CALLCODE') {
                        let collee = '0x'+stack[stack.length-2].substring(24);
                        let value = ethers.utils.parseEther(ethers.utils.formatEther('0x'+stack[stack.length-3]));
                        balanceChanges[currentContractAddress] = balanceChanges[currentContractAddress].sub(value);
                        if (!balanceChanges[collee]) {
                            balanceChanges[collee] = BigNumber.from(0);
                        }
                        balanceChanges[collee] = balanceChanges[collee].add(value);
                        console.log({op});
                        process.exit(0);
                    }
                }


                if (transaction.to === DEPLOYER_ADDRESS) {

                    // process.exit(0);
                    for (let op of trace.structLogs) {
                        let stack = op.stack;
                        if (op.op === 'LOG3') {
                            stack.pop()
                            stack.pop()
                            let topic = stack[stack.length-3];
                            let transfer_from = stack[stack.length-4];
                            let transfer_to = stack[stack.length-5];
                            let transfer_amount = stack[stack.length-6];
                            if (topic == TRANSFER_TOPIC) {
                                if (!erc20BalanceChanges[currentContractAddress]) {
                                    erc20BalanceChanges[currentContractAddress] = {};
                                }
                                if (!erc20BalanceChanges[currentContractAddress][transfer_from]) {
                                    erc20BalanceChanges[currentContractAddress][transfer_from] = BigNumber.from(0);
                                }
                                if (!erc20BalanceChanges[currentContractAddress][transfer_to]) {
                                    erc20BalanceChanges[currentContractAddress][transfer_to] = BigNumber.from(0);
                                }
                                erc20BalanceChanges[currentContractAddress][transfer_from] = erc20BalanceChanges[currentContractAddress][transfer_from].sub(transfer_amount);
                                erc20BalanceChanges[currentContractAddress][transfer_from] = erc20BalanceChanges[currentContractAddress][transfer_to].sub(transfer_amount);
                            }            
                        }
                    }
                }


                let transfers: Transfer[] = [];
                for (let address in balanceChanges) {
                    if (SCAAs.add(address)) {
                        let tr = CoinTransfer.build({
                            txHash: transaction.hash,
                            account: address,
                            value: ethers.utils.formatEther(balanceChanges[address]),
                            symbol: 'ETH',
                            time: new Date(block.timestamp*1000)
                        });
                        try {
                            await tr.save();
                        } catch(e) { 
                            // console.log(e)
                        }
                        transfers.push({
                            address, value: ethers.utils.formatEther(balanceChanges[address]),
                            symbol: 'ETH'
                        });    
                    }
                }
                
            } catch {}

        }
        
        
        sync.blockNumber += 1;
        await sync.save();
    }

    return res.status(200).json({ 
        sync
    });
}

export const history = async (req: Request, res: Response, next: NextFunction) => {
    const [owner] = await ethers.getSigners();
    let { address, key }: any = req.query;
    let abi = [
        "event Skip(bytes32 nonce)",
        "event NoneMatches(bytes32 nonce)",
        "event TxDone(bytes32 nonce, address to, uint value, bytes data)",
        "event TxReverted(bytes32 nonce, address to, uint value, bytes data, string message)",
        "event GasStop()"
    ];
    console.log({address});
    const contract = new ethers.Contract(
        ethers.utils.getAddress(address),
        abi,
        await ethProvider()
    );
    const add = (l1: any[], l2: any[]) => {
        let res = [];
        for (let i = 0; i < l1.length; i++) {
            res.push(l1[i]);
        }
        for (let i = 0; i < l2.length; i++) {
            res.push(l2[i]);
        }
        return res;
    }
    let logs = await contract.queryFilter(contract.filters.Skip())
    logs = add(logs, await contract.queryFilter(contract.filters.NoneMatches()));
    logs = add(logs, await contract.queryFilter(contract.filters.TxDone()));
    logs = add(logs, await contract.queryFilter(contract.filters.TxReverted()));
    logs = add(logs, await contract.queryFilter(contract.filters.GasStop()));
    logs = logs.sort((log1, log2) => log2.blockNumber-log1.blockNumber);

    let activities: any[] = await CoinTransfer.findAll({where: {account: {[Op.or]: [address, address.toLowerCase()]}, value: {[Op.ne]: '0.0'}}});
    for (let log of logs) {
        switch(log.event === 'TxDone') {

        }
    }

    return res.status(200).json({ 
        activities
    });
}

export const getGasFeeAccount = async (req: Request, res: Response, next: NextFunction) => {
    const [owner] = await ethers.getSigners();
    let { address, key } = req.body;
    const feesAccount: any = await FeesAccount.findByPk(address);
    if (feesAccount) {
        if (sha256(feesAccount.PK).digest('hex') === key) {
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



// export const signup = async (req: Request, res: Response, next: NextFunction) => {
//     let { feesAddress, key, gasLimit }: any = req.body;
//     gasLimit = gasLimit||3_500_000;
//     try {
//         throw new Error("Currently not in use");
//         let feesAccount = await signinFeesAccount(feesAddress, key);
//         let tx = await deploy(feesAccount.PK, { gasLimit, ...gasConfiguration() });
//         let status = 'pending';
//         if (tx.status === 1) {
//             status = 'done';
//         } else if (tx.status === 2) {
//             status = 'failed';
//         }
//         return res.status(200).json({ tx: { hash: tx.hash, status } });
//     } catch(e: any) {
//         return res.status(500).json({ error: e?.message||JSON.stringify(e)});
//     }
// }



// const generateNewWallet = async () => {
//     const [owner] = await ethers.getSigners();
//     let addressData = ethWallet.generate();
//     let address = addressData.getAddressString();
//     let PK = addressData.getPrivateKeyString();
//     let key = sha256(PK).digest('hex');

//     let gasLimit = 1_500_000;
//     await owner.sendTransaction({
//         to: address, value: ethers.utils.parseEther("8")
//     });
//     let tx = await deployFor(address, { gasLimit, ...gasConfiguration() });
//     let receipt = await tx.wait();
//     let [{ args: {account: SCAA} }] = receipt.events;
//     await FeesAccount.build({ address, PK, SCAA }).save();

//     const params = {
//         from: owner.address,
//         to: '0xaca8de99d892f7872e28572730bbeb4112a37f7b',
//         value: ethers.utils.parseUnits('8', 'ether').toHexString()
//     };

//     // SCAA = params.to;

//     await owner.sendTransaction({
//         to: SCAA, value: ethers.utils.parseEther("2"), gasLimit
//     });
//     return {address, PK, key, SCAA}
// }

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


// const deploy = async (PK: string, { gasLimit, maxFeePerGas, maxPriorityFeePerGas }: any) => {
//     let addr = new ethers.Wallet(PK, await ethProvider()); // TODO wrap in function
//     const Depolyer = await ethers.getContractFactory(DEPOLYER_CONTRACT_NAME);
//     const deployer = Depolyer.attach(DEPLOYER_ADDRESS);    
//     console.log({ gasLimit, maxFeePerGas, maxPriorityFeePerGas });
//     console.log({adderss: addr.address})
//     return await deployer.connect(addr).createAccount({ gasLimit, maxFeePerGas, maxPriorityFeePerGas });
// }

// const gasConfiguration = () => {
//     let maxFeePerGas, maxPriorityFeePerGas;
//     maxFeePerGas = maxPriorityFeePerGas = getMaxFeePerGas();
//     return {maxFeePerGas, maxPriorityFeePerGas};
// }

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
    let { address, cert, feesAddress }: SignupBody = req.body;
    let gasLimit = 1_500_000;

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
    console.log({owner, addr, DEPLOYER_ADDRESS})
    
    let maxFeePerGas, maxPriorityFeePerGas;
    maxFeePerGas = maxPriorityFeePerGas = getMaxFeePerGas();
    console.log(await addr.getBalance());
    console.log(await addr.provider.getBalance(address));
    console.log(await addr.provider.getBalance(address));
    let connect = deployer.connect(addr);
    let tx = await connect.initAccount(address, cert, {  });
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
    if (data) {
        data = data.toLowerCase();
    }
    console.log({data});
    let a = true;

    let gasLimit = 1_500_000+10*(data.length);
    const [owner] = await ethers.getSigners();
    let feesAccount: any = await FeesAccount.findOne({ where: { SCAA: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }

    // ethers.utils.TraMa
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);
    const wallet = await loadWallet(address);
    const state = await wallet.getState();
    let value = ethers.utils.parseEther(ethers.utils.formatEther(valueStr));
    let maxFeePerGas = getMaxFeePerGas();
    let maxPriorityFeePerGas = maxFeePerGas;
    let rgfProviderAddress = state.rgfProvider;
    let rgfProvider = await loadRgfProvider(rgfProviderAddress);
    let fees = (await rgfProvider.get(data.length/2-1, state.presetCursor));
    // let nonce = await wallet.provider.getTransactionCount(addr.address);
    console.log(addr.address);
    console.log({
        addr, b: ethers.utils.formatEther(await wallet.provider.getBalance(addr.address)),
        gasLimit:  ethers.utils.formatEther(BigNumber.from(gasLimit).mul(maxFeePerGas)),
        fees: ethers.utils.formatEther(fees)
    });
    console.log({b: ethers.utils.formatEther(await rgfProvider.get((data.length-2)/2, 0))})
    let transaction = await wallet.connect(addr).preset(to, value, data, txCert, { value: fees });
    // let transaction = await wallet.connect(addr).preset(to, value, data, txCert, { value: fees, gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    // if (a) {
    //     return res.status(200).json({
    //         notYet: true, transaction
    //     });
    // }
    return res.status(200).json({ transaction });
}

export const expose = async (req: Request, res: Response, next: NextFunction) => {
    let { address, proof, gasLimit }: any = req.body;
    gasLimit = gasLimit||3_500_000;
    let maxFeePerGas = getMaxFeePerGas();
    let maxPriorityFeePerGas = maxFeePerGas;

    const [owner] = await ethers.getSigners();
    let feesAccount: any = await FeesAccount.findOne({ where: { SCAA: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' })
    }
    let addr = new ethers.Wallet(feesAccount.PK, owner.provider);

    const wallet = await loadWallet(address);
    let nonce = await wallet.provider.getTransactionCount(addr.address);
    let transaction = await wallet.connect(addr).expose('0x'+proof, 0, { gasLimit });
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
    let nonce = await wallet.provider.getTransactionCount(addr.address);
    let maxFeePerGas = getMaxFeePerGas();
    let maxPriorityFeePerGas = maxFeePerGas;
    let transaction = await wallet.connect(addr).exposeCont({gasLimit});
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
    // let URL = 'https://gpoly.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle';
    // try {
    //     let res = await axios.get(URL);
    //     let data = res.data;
    //     if (data.message === 'OK') {
    //         let {SafeGasPrice: standard, ProposeGasPrice: fast, FastGasPrice: rapid, UsdPrice: usdPrice }: any = data?.result;
    //         gasMarket = { standard, fast, rapid, usdPrice };
    //         let rawdata = JSON.stringify(gasMarket, null, 4);
    //         // fs.writeFileSync(ORACLE_STORAGE, rawdata);
    //     }
    // }catch (e: any) {
    //     console.error(e);
    // }
    console.log({gasMarket});
    // setTimeout(gasOracle, 10000);
}
gasOracle();
