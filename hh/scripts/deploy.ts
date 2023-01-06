import { ethers } from "hardhat";
import fs from 'fs';

async function main() {
  // const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  // const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  // const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  // const lockedAmount = ethers.utils.parseEther("1");

  // const Token = await ethers.getContractFactory("WalletLessDeployer");
  // // console.log(ERC20Dex);
  // const token = await Token.deploy("T", "T", 20000);
  const WalletlessDeployer = await ethers.getContractFactory("WalletlessDeployer");
  const walletlessDeployer = await WalletlessDeployer.deploy();

  await walletlessDeployer.deployed();

  let data = JSON.parse(fs.readFileSync('./artifacts/contracts/WalletlessDeployer.sol/WalletlessDeployer.json').toString());
  console.log({abi: data.abi});
  fs.writeFileSync('./deployments/localhost.txt', walletlessDeployer.address);
  // console.log(WalletlessDeployer.abi);
  fs.writeFileSync('./abis/WalletlessDeployer.json', JSON.stringify(data.abi, true, 4));
  data = JSON.parse(fs.readFileSync('./artifacts/contracts/Walletless.sol/Walletless.json').toString());
  fs.writeFileSync('./abis/Walletless.json', JSON.stringify(data.abi, true, 4));
  console.log(`deployed to ${walletlessDeployer.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
