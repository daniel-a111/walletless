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
  const WalletlessDeployer = await ethers.getContractFactory('WalletlessDeployer');
  const deployer = WalletlessDeployer.attach(DEPLOYER_ADDRESS);
  // console.log({deployer});
  const nonce = await owner.provider?.getTransactionCount(deployer.address) || 1;
  let addresses: string[] = [];
  let creates: any[] = [];
  for (let i = 0; i < 1; i++) {

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
  // console.log({tx})
  // console.log({receipt})
  // console.log(owner.provider.getre);
  // const trace = await hre.network.provider.send("debug_traceTransaction", [
  //   "0x7a0f0bb0794542741673803a8d8cc0a658023b3406df64fb26bdefa550a4a73c",
  //   {
  //     disableMemory: true,
  //     disableStorage: true,
  //     tracer: "callTracer"
  //   },
  // ]);
  
  const trace = await hre.network.provider.send("debug_traceTransaction", [
    tx.hash,
    {
      disableMemory: false,
      disableStorage: false,
      disableStack: false,
      tracer: "callTracer"
    },
  ]);
  console.log({trace})
  console.log(tx.hash);
  for (let log of trace.structLogs) {
    // console.log({log});
    if (log.op.startsWith('CALL')) {
      console.log({log});
    }
    if (log.op.startsWith('RETURN')) {
      console.log({log});
    }
  }
  // let e = expect(tx);
  // for (let create of creates) {
  //   // console.log(create);
  //   e.emit(deployer, 'ScaaCreated').withArgs(create.account, create.initializer);
  // }
  // await e;
  // console.log({receipt});
  console.log({calls: trace.calls})

  // for (let l of trace.structLogs) {
  //   if (l.op.indexOf('CALL')>=0) {
  //     console.log(l);
  //   }
  // }

  for (let create of creates) {
    let feesAccount = FeesAccount.build({
      address: create.initializer,
      PK: create.PK,
      SCAA: create.account
    });
    await feesAccount.save();
  }

  // const Walletless = await ethers.getContractFactory('Walletless');
  // for (let create of creates) {
  //   let addr = new ethers.Wallet(create.PK, ethers.provider); // TODO wrap in function
  //   owner.sendTransaction({to: addr.address, value: ethers.utils.parseEther("0.3")});
  //   await deployer.connect(addr).initAccount(create.account, ethers.utils.sha256('0xabca'));
  //   const walletless = await Walletless.attach(create.account);
  //   console.log(await walletless.getState());
  // }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
