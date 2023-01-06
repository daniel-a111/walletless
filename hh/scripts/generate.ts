import fs from 'fs';
import { ethers } from "hardhat";
import hre from "hardhat";
import { CONTRACT_NAME, DEPOLYER_CONTRACT_NAME } from "../src/constants";
import {BigNumber} from 'ethers';
import {crypto} from '../src/walletless';
import { expect } from "chai";
import ethWallet from'ethereumjs-wallet';
import { sha256 } from "../src/utils";
import { FeesAccount } from "../src/models";
const { getContractAddress } = require('@ethersproject/address')

export const DEPLOYER_ADDRESS = fs.readFileSync('./deployments/localhost.txt').toString(); // localhost

async function main() {

  const [owner] = await ethers.getSigners();
  const WalletlessDeployer = await ethers.getContractFactory('WalletlessDeployer');
  const deployer = WalletlessDeployer.attach(DEPLOYER_ADDRESS);
  const nonce = await owner.provider?.getTransactionCount(deployer.address) || 1;

  const HOW_MANY = 10;
  let addresses: string[] = [];
  let creates: any[] = [];
  for (let i = 0; i < HOW_MANY; i++) {

    let account = getContractAddress({from: deployer.address, nonce: nonce+i });
    console.log(account);

    let addressData = ethWallet.generate();
    let address = ethers.utils.getAddress(addressData.getAddressString());
    let PK = addressData.getPrivateKeyString();
    console.log({address, PK});
    creates.push({
      account, initializer: address, PK
    });
    addresses.push(address);
  }

  // let tx = deployer.deployFor([addresses]);
  console.log({addresses})
  let tx = await deployer.deployFor(addresses, creates[0].account, {value: ethers.utils.parseEther('4.0').mul(addresses.length)});
  console.log(await owner.provider?.getBalance(deployer.address))
  const waitForTx = async () => {

    const receipt = await owner.provider?.getTransactionReceipt(tx.hash);
    if (receipt) {
      console.log({receipt})
    } else {
      await new Promise((accept) => {
        setTimeout(() => {
          accept(true);
        }, 1000);  
      });
      await waitForTx();
    }
  }

  await waitForTx();
  
  for (let create of creates) {
    let feesAccount = FeesAccount.build({
      address: create.initializer,
      PK: create.PK,
      SCAA: create.account
    });
    await feesAccount.save();
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
