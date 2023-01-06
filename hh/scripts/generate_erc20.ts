import fs from 'fs';
import { ethers } from "hardhat";
import { CONTRACT_NAME, DEPOLYER_CONTRACT_NAME } from "../src/constants";
import {BigNumber} from 'ethers';
import {crypto} from '../src/walletless';
import { expect } from "chai";
import ethWallet from'ethereumjs-wallet';
import { sha256 } from "../src/utils";
import { FeesAccount } from "../src/models";
const { getContractAddress } = require('@ethersproject/address')

export const DEPLOYER_ADDRESS = fs.readFileSync('./deployments/localhost.txt').toString(); // localhost

const deployDeployer = async () => {
  const [owner, addr1, addr2, addr3] = await ethers.getSigners();
  const WalletlessDeployer = await ethers.getContractFactory('WalletlessDeployer');
  const deployer = await WalletlessDeployer.deploy();
  return {deployer};
};

const deployReverter = async () => {
  const [owner, addr1, addr2, addr3] = await ethers.getSigners();
  const Reverter = await ethers.getContractFactory('Reverter');
  const reverter = await Reverter.deploy();
  return {reverter};
};

async function main() {
  const [owner, addr1, addr2, addr3] = await ethers.getSigners();
  // let { deployer }: any = await deployDeployer();
  let coins: any[] = [];
  coins.push({
    name: "Wrapped Bitcoin", symbol: "WBTC", decimals: 18,
    price: 17_000,
    logo: "/icons/btc.svg"
  },{
    name: "DAI", symbol: "DAI", decimals: 18,
    price: 1,
    logo: "/icons/dai.svg"
  },{
    name: "Tether", symbol: "USDT", decimals: 18,
    price: 1,
    logo: "/icons/usdt.svg"
  });

  const Coin = await ethers.getContractFactory('Coin');
  for (let coin of coins) {
    const erc20 = await Coin.deploy(coin.name, coin.symbol, ethers.utils.parseEther("100000000"));
    // await erc20._mint(owner.address, ethers.utils.parseEther("1000"));
    coin.address = erc20.address;
  }

  fs.writeFileSync("./coins.json", JSON.stringify(coins, true, 4))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
