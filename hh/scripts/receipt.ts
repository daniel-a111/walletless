import hre, { ethers } from "hardhat";
import { BigNumber } from 'ethers';
import { CoinTransfer, SyncStatus } from "../src/models";

async function main() {
  const [owner] = await ethers.getSigners();
  let provider = owner.provider;

  let txHash = '0x3c7a600870c1e9169c51358b57ebf67e3266b6b7392cca2af7c31d199d182c45';
  let transaction = await provider?.getTransaction(txHash)
  let receipt = await provider?.getTransactionReceipt(txHash);
  console.log({receipt, transaction});
  console.log({logs: receipt?.logs})
  console.log({log: receipt?.logs[0].topics})
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
