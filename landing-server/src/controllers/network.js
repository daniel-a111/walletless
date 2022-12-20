"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tx = exports.manualRGFProviderView = exports.getAccount = exports.receipt = void 0;
const hardhat_1 = require("hardhat");
const constants_1 = require("../constants");
const axios_1 = __importDefault(require("axios"));
const receipt = async (req, res, next) => {
    let { hash } = req.query;
    // // TODO cheap deploy
    const [owner] = await hardhat_1.ethers.getSigners();
    try {
        let receipt = await owner.provider?.getTransactionReceipt(hash);
        console.log({ receipt });
        return res.status(200).json({ receipt });
    }
    catch (e) {
        // throw e;
        return res.status(200).json({ error: e?.message || JSON.stringify(e) });
    }
};
exports.receipt = receipt;
const loadAccount = async (address, rgfDetailed = false) => {
    const [owner, addr1, addr2, addr3] = await hardhat_1.ethers.getSigners();
    const TwoFactorWallet = await hardhat_1.ethers.getContractFactory(constants_1.CONTRACT_NAME);
    const wallet = TwoFactorWallet.attach(address);
    let { cert, nonce, active: isActive, pending: pendingArr, pendingCounter, pendingAttackCounter, txProcessing, processingCursor, rgfProvider } = await wallet.getState();
    let pending = [];
    for (let i = 0; i < pendingArr.length; i++) {
        let { to, value, data, cert } = pendingArr[i];
        pending.push({ to, value: hardhat_1.ethers.utils.formatEther(value), data, cert });
    }
    let account = {
        address,
        cert,
        nonce: parseInt(hardhat_1.ethers.utils.formatUnits(nonce, 0)),
        balance: hardhat_1.ethers.utils.formatEther(await owner.provider?.getBalance(address) || '0'),
        isActive, pending, pendingCounter,
        pendingAttackCounter: parseInt(hardhat_1.ethers.utils.formatUnits(pendingAttackCounter, 0)), txProcessing, processingCursor,
        rgfProvider
    };
    return account;
};
const getAccount = async (req, res, next) => {
    let { address } = req.query;
    if (req.body?.address) {
        address = req.body.address;
    }
    try {
        const TwoFactorWallet = await hardhat_1.ethers.getContractFactory(constants_1.CONTRACT_NAME);
        const wallet = TwoFactorWallet.attach(address);
        return res.status(200).json({ account: await loadAccount(wallet.address) });
    }
    catch (e) {
        return res.status(500).json({ e: JSON.stringify(e), message: e?.message });
    }
};
exports.getAccount = getAccount;
const loadWallet = async (address) => {
    const TwoFactorWallet = await hardhat_1.ethers.getContractFactory(constants_1.CONTRACT_NAME);
    return TwoFactorWallet.attach(address);
    ;
};
const loadRgfProvider = async (address) => {
    const TwoFactorWallet = await hardhat_1.ethers.getContractFactory(constants_1.RGF_MANUAL_CONTRACT_NAME);
    return TwoFactorWallet.attach(address);
    ;
};
const manualRGFProviderView = async (req, res, next) => {
    let { address } = req.query;
    const rgfProvider = await loadRgfProvider(address);
    const RGF = parseInt(hardhat_1.ethers.utils.formatUnits(await rgfProvider.RGF(), 0));
    const RGFM = parseInt(hardhat_1.ethers.utils.formatUnits(await rgfProvider.RGFM(), 0));
    const MIN_RGF = parseInt(hardhat_1.ethers.utils.formatUnits(await rgfProvider.MIN_RGF(), 0));
    return res.status(200).json({ address, RGF, RGFM, MIN_RGF });
};
exports.manualRGFProviderView = manualRGFProviderView;
const tx = async (req, res, next) => {
    let { hash } = req.query;
    // // TODO cheap deploy
    const [owner] = await hardhat_1.ethers.getSigners();
    try {
        let tx = await owner.provider?.getTransaction(hash);
        return res.status(200).json({ tx });
    }
    catch (e) {
        // throw e;
        return res.status(200).json({ error: e?.message || JSON.stringify(e) });
    }
};
exports.tx = tx;
let gasMarket;
const gasOracle = async () => {
    let URL = 'https://gpoly.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle';
    try {
        let res = await axios_1.default.get(URL);
        let data = res.data;
        if (data.message === 'OK') {
            let { SafeGasPrice: standard, ProposeGasPrice: fast, FastGasPrice: rapid, UsdPrice: usdPrice } = data?.result;
            gasMarket = { standard, fast, rapid, usdPrice };
        }
    }
    catch { }
    setTimeout(gasOracle, 1000);
};
gasOracle();
// export default {
//     receipt,
//     getAccount,
//     signupTxStatus,
//     initTxStatus,
//     manualRGFProviderView,
//     gasMarketView
// };
