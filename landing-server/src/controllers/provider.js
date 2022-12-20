"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTxStatus = exports.signupTxStatus = exports.gasMarketView = exports.exposeCont = exports.expose = exports.transactPreset = exports.initAccount = exports.signup = exports.getGasFeeAccount = exports.createGasFeeAccount = exports.DEPLOYER_ADDRESS = void 0;
const fs_1 = __importDefault(require("fs"));
const hardhat_1 = require("hardhat");
const ethers_1 = require("ethers");
const constants_1 = require("../constants");
const ethereumjs_wallet_1 = __importDefault(require("ethereumjs-wallet"));
const models_1 = require("../models");
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("../utils");
// export const DEPLOYER_ADDRESS = '0x9eBb49B2004C753f6Fb8b3181C224a8972f70528'; // aws
// export const DEPLOYER_ADDRESS = '0x932A101a6f276C53fb2e86b767DaeD8D213Ba27E'; // MATIC
exports.DEPLOYER_ADDRESS = '0x3155755b79aA083bd953911C92705B7aA82a18F9'; // localhost
// let GWEI = 1000000000;
// let maxFeePerGas = ethers.BigNumber.from(40000000000) // fallback to 40 gwei
// let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000) // fallback to 40 gwei
const createGasFeeAccount = async (req, res, next) => {
    let {} = req.body;
    let { address, key } = await generateNewWallet();
    return res.status(200).json({
        provider: { address, key, balance: await balanceOf(address) }
    });
};
exports.createGasFeeAccount = createGasFeeAccount;
const getGasFeeAccount = async (req, res, next) => {
    const [owner] = await hardhat_1.ethers.getSigners();
    let { address, key } = req.body;
    const feesAccount = await models_1.FeesAccount.findByPk(address);
    if (feesAccount) {
        if ((0, utils_1.sha256)(feesAccount.PK).digest('hex') === key) {
            return res.status(200).json({ provider: {
                    address, key, balance: await balanceOf(address)
                } });
        }
        else if (feesAccount.walletAddress) {
            let wallet = await loadWallet(feesAccount.walletAddress);
            let { cert } = await wallet.getState();
            if ((0, utils_1.sha256)(key).digest('hex') === cert) {
                return res.status(200).json({ provider: {
                        address, balance: await balanceOf(address)
                    } });
            }
        }
    }
    return res.status(400).json({ message: 'unauthorized' });
};
exports.getGasFeeAccount = getGasFeeAccount;
const signup = async (req, res, next) => {
    let { feesAddress, key, gasLimit } = req.body;
    gasLimit = gasLimit || 3500000;
    try {
        let feesAccount = await signinFeesAccount(feesAddress, key);
        let tx = await deploy(feesAccount.PK, { gasLimit, ...gasConfiguration() });
        let status = 'pending';
        if (tx.status === 1) {
            status = 'done';
        }
        else if (tx.status === 2) {
            status = 'failed';
        }
        return res.status(200).json({ tx: { hash: tx.hash, status } });
    }
    catch (e) {
        return res.status(200).json({ error: e?.message || JSON.stringify(e) });
    }
};
exports.signup = signup;
const generateNewWallet = async () => {
    let addressData = ethereumjs_wallet_1.default.generate();
    let address = addressData.getAddressString();
    let PK = addressData.getPrivateKeyString();
    let key = (0, utils_1.sha256)(PK).digest('hex');
    await models_1.FeesAccount.build({ address, PK }).save();
    return { address, PK, key };
};
const balanceOf = async (address) => {
    const [owner] = await hardhat_1.ethers.getSigners();
    return hardhat_1.ethers.utils.formatEther(await owner.provider?.getBalance(address) || '0');
};
const ethProvider = async () => {
    const [owner] = await hardhat_1.ethers.getSigners();
    return owner.provider;
};
const deploy = async (PK, { gasLimit, maxFeePerGas, maxPriorityFeePerGas }) => {
    let addr = new hardhat_1.ethers.Wallet(PK, await ethProvider());
    const Depolyer = await hardhat_1.ethers.getContractFactory(constants_1.DEPOLYER_CONTRACT_NAME);
    const deployer = Depolyer.attach(exports.DEPLOYER_ADDRESS);
    return await deployer.connect(addr).createAccount({ gasLimit, maxFeePerGas, maxPriorityFeePerGas });
};
const gasConfiguration = () => {
    let maxFeePerGas, maxPriorityFeePerGas;
    maxFeePerGas = maxPriorityFeePerGas = getMaxFeePerGas();
    return { maxFeePerGas, maxPriorityFeePerGas };
};
const signinFeesAccount = async (address, key) => {
    const feesAccount = await models_1.FeesAccount.findByPk(address);
    if (feesAccount) {
        if ((0, utils_1.sha256)(feesAccount.PK).digest('hex') === key) {
            return feesAccount;
        }
        else if (feesAccount.walletAddress) {
            let wallet = await loadWallet(feesAccount.walletAddress);
            let { cert } = await wallet.getState();
            if ((0, utils_1.sha256)(key).digest('hex') === cert) {
                return feesAccount;
            }
        }
    }
    throw 'key authentication failed';
};
const initAccount = async (req, res, next) => {
    const [owner] = await hardhat_1.ethers.getSigners();
    let { address, cert, nonceSize, feesAddress } = req.body;
    let gasLimit = 2500000;
    const Depolyer = await hardhat_1.ethers.getContractFactory(constants_1.DEPOLYER_CONTRACT_NAME);
    const deployer = Depolyer.attach(exports.DEPLOYER_ADDRESS);
    let feesAccount = await models_1.FeesAccount.findOne({ where: { address: feesAddress } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' });
    }
    if (feesAccount.walletAddress && feesAccount.walletAddress !== address) {
        return res.status(500).json({ message: 'gas provider already has a wallet' });
    }
    console.log({ feesAccount });
    console.log({ address });
    feesAccount.walletAddress = address;
    await feesAccount.save();
    let addr = new hardhat_1.ethers.Wallet(feesAccount.PK, owner.provider);
    let maxFeePerGas, maxPriorityFeePerGas;
    maxFeePerGas = maxPriorityFeePerGas = getMaxFeePerGas();
    console.log({ address, cert, RGF: constants_1.RGF, RGFM: constants_1.RGFM, MIN_RGF: constants_1.MIN_RGF, gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    // let tx = await deployer.connect(addr).initAcount(address, cert, nonceSize, RGF, RGFM, MIN_RGF, { gasLimit: 2_500_000, maxFeePerGas, maxPriorityFeePerGas });
    let tx = await deployer.connect(addr).initAcount(address, cert, constants_1.RGF, constants_1.RGFM, constants_1.MIN_RGF, { gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    console.log({ tx });
    return res.status(200).json({ tx });
};
exports.initAccount = initAccount;
const loadWallet = async (address) => {
    const SCAA = await hardhat_1.ethers.getContractFactory(constants_1.CONTRACT_NAME);
    return SCAA.attach(address);
};
const loadRgfProvider = async (address) => {
    const TwoFactorWallet = await hardhat_1.ethers.getContractFactory(constants_1.RGF_MANUAL_CONTRACT_NAME);
    return TwoFactorWallet.attach(address);
    ;
};
const getMaxFeePerGas = () => {
    if (!gasMarket) {
        throw Error("oracle is not initiated yet");
    }
    return hardhat_1.ethers.utils.parseUnits(gasMarket.rapid, 9);
};
const gasMethodToMaxFeePerGas = (gasMethod) => {
    if (!gasMarket) {
        throw Error("oracle is not initiated yet");
    }
    if (gasMethod === 'standard') {
        return ethers_1.BigNumber.from(gasMarket?.standard);
    }
    else if (gasMethod === 'fast') {
        return ethers_1.BigNumber.from(gasMarket?.fast);
    }
    else if (gasMethod === 'rapid') {
        return ethers_1.BigNumber.from(gasMarket?.rapid);
    }
    else {
        throw Error("Gas Method must be chosen");
    }
};
const transactPreset = async (req, res, next) => {
    let { address, to, value: valueStr, data, txCert } = req.body;
    let gasLimit = 2500000 + 10 * (data.length);
    console.log({ address, to, value: valueStr, data, txCert });
    const [owner] = await hardhat_1.ethers.getSigners();
    let feesAccount = await models_1.FeesAccount.findOne({ where: { walletAddress: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' });
    }
    let addr = new hardhat_1.ethers.Wallet(feesAccount.PK, owner.provider);
    const wallet = await loadWallet(address);
    const state = await wallet.getState();
    let value = hardhat_1.ethers.utils.parseEther(valueStr);
    let maxFeePerGas = getMaxFeePerGas();
    let maxPriorityFeePerGas = maxFeePerGas;
    let rgfProviderAddress = state.rgfProvider;
    let rgfProvider = await loadRgfProvider(rgfProviderAddress);
    let fees = (await rgfProvider.getManual(data.length / 2 - 1, state.pendingAttackCounter, maxFeePerGas));
    console.log({ fees });
    let nonce = await wallet.provider.getTransactionCount(addr.address);
    let transaction = await wallet.connect(addr).call(to, value, data, txCert, { nonce, value: fees, gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    console.log(await wallet.provider.getTransactionCount(addr.address));
    // let transaction = {};
    console.log({ transaction });
    return res.status(200).json({ transaction });
};
exports.transactPreset = transactPreset;
const expose = async (req, res, next) => {
    let { address, proof, gasLimit } = req.body;
    gasLimit = gasLimit || 2500000;
    let maxFeePerGas = getMaxFeePerGas();
    let maxPriorityFeePerGas = maxFeePerGas;
    const [owner] = await hardhat_1.ethers.getSigners();
    let feesAccount = await models_1.FeesAccount.findOne({ where: { walletAddress: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' });
    }
    let addr = new hardhat_1.ethers.Wallet(feesAccount.PK, owner.provider);
    const wallet = await loadWallet(address);
    let nonce = await wallet.provider.getTransactionCount(addr.address);
    let transaction = await wallet.connect(addr).expose('0x' + proof, 0, { nonce, gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    console.log({ transaction });
    return res.status(200).json({ transaction });
};
exports.expose = expose;
const exposeCont = async (req, res, next) => {
    let { address, gasLimit } = req.body;
    gasLimit = gasLimit || 2500000;
    const [owner] = await hardhat_1.ethers.getSigners();
    let feesAccount = await models_1.FeesAccount.findOne({ where: { walletAddress: address } });
    if (!feesAccount) {
        return res.status(500).json({ message: 'fee account missing or dont have balance' });
    }
    let addr = new hardhat_1.ethers.Wallet(feesAccount.PK, owner.provider);
    const wallet = await loadWallet(address);
    let nonce = await wallet.provider.getTransactionCount(addr.address);
    let maxFeePerGas = getMaxFeePerGas();
    let maxPriorityFeePerGas = maxFeePerGas;
    let transaction = await wallet.connect(addr).exposeCont({ nonce, gasLimit, maxFeePerGas, maxPriorityFeePerGas });
    console.log({ transaction });
    return res.status(200).json({ transaction });
};
exports.exposeCont = exposeCont;
const gasMarketView = async (req, res, next) => {
    console.log({ gasMarket });
    return res.status(200).json({ gasMarket });
};
exports.gasMarketView = gasMarketView;
const dataToAddress = (data) => {
    return '0x' + data.substring(26);
};
const signupTxStatus = async (req, res, next) => {
    let { hash } = req.query;
    let status = 'pending';
    let account;
    const [owner] = await hardhat_1.ethers.getSigners();
    try {
        let receipt = await owner.provider?.getTransactionReceipt(hash);
        if (!receipt) {
            status = 'failed';
        }
        else {
            if (receipt?.status === 0) {
                status = 'failed';
            }
            else if (receipt?.status === 1) {
                status = 'done';
            }
            console.log({ receipt });
            let [{ data }] = receipt?.logs || [];
            let walletAddress = dataToAddress(data);
            account = await loadAccount(walletAddress);
        }
        return res.status(200).json({ tx: { hash, status }, account });
    }
    catch (e) {
        throw e;
        return res.status(200).json({ error: e?.message || JSON.stringify(e) });
    }
};
exports.signupTxStatus = signupTxStatus;
const initTxStatus = async (req, res, next) => {
    let { hash } = req.query;
    const [owner] = await hardhat_1.ethers.getSigners();
    try {
        let receipt = await owner.provider?.getTransactionReceipt(hash);
        let status = 'pending';
        if (receipt?.status === 0) {
            status = 'failed';
        }
        else if (receipt?.status === 1) {
            status = 'done';
        }
        console.log({ receipt });
        console.log({ status });
        return res.status(200).json({ tx: { hash, status } });
    }
    catch (e) {
        return res.status(200).json({ error: e?.message || JSON.stringify(e) });
    }
};
exports.initTxStatus = initTxStatus;
const loadAccount = async (address, rgfDetailed = false) => {
    const [owner, addr1, addr2, addr3] = await hardhat_1.ethers.getSigners();
    const TwoFactorWallet = await hardhat_1.ethers.getContractFactory(constants_1.CONTRACT_NAME);
    const wallet = TwoFactorWallet.attach(address);
    let feesAccount = await models_1.FeesAccount.findOne({ where: { walletAddress: address } });
    // let feesAccountAddress = feesAccount?.address||FEES_ACCOUNT;
    let { cert, nonce, active: isActive, pending: pendingArr, pendingCounter, pendingAttackCounter, txProcessing, processingCursor, rgfProvider } = await wallet.getState();
    let pending = [];
    for (let i = 0; i < pendingArr.length; i++) {
        let { to, value, data, cert } = pendingArr[i];
        pending.push({ to, value: hardhat_1.ethers.utils.formatEther(value), data, cert });
    }
    // let ethBalance = await owner.provider?.getBalance(address);
    // let usdBalance = ethBalance?.mul(BigNumber.from(ma))
    let account = {
        address,
        cert,
        nonce: parseInt(hardhat_1.ethers.utils.formatUnits(nonce, 0)),
        balance: hardhat_1.ethers.utils.formatEther(await owner.provider?.getBalance(address) || '0'),
        // feesAccount: feesAccount?.address||FEES_ACCOUNT,
        // gasFeesBalance: ethers.utils.formatEther(await owner.provider?.getBalance(feesAccountAddress)||'0'),
        isActive, pending, pendingCounter,
        pendingAttackCounter: parseInt(hardhat_1.ethers.utils.formatUnits(pendingAttackCounter, 0)), txProcessing, processingCursor,
        rgfProvider
    };
    return account;
};
let gasMarket;
let ORACLE_STORAGE = 'oracle.json';
const gasOracle = async () => {
    if (fs_1.default.existsSync(ORACLE_STORAGE)) {
        let rawdata = fs_1.default.readFileSync(ORACLE_STORAGE, { encoding: "utf8" });
        gasMarket = JSON.parse(rawdata);
    }
    let URL = 'https://gpoly.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle';
    try {
        let res = await axios_1.default.get(URL);
        let data = res.data;
        if (data.message === 'OK') {
            let { SafeGasPrice: standard, ProposeGasPrice: fast, FastGasPrice: rapid, UsdPrice: usdPrice } = data?.result;
            gasMarket = { standard, fast, rapid, usdPrice };
            let rawdata = JSON.stringify(gasMarket, null, 4);
            // fs.writeFileSync(ORACLE_STORAGE, rawdata);
        }
    }
    catch (e) {
        console.error(e);
    }
    console.log({ gasMarket });
    setTimeout(gasOracle, 10000);
};
gasOracle();
