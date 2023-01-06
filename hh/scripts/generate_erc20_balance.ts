import fs from 'fs';
import { ethers } from "hardhat";

export const DEPLOYER_ADDRESS = fs.readFileSync('./deployments/localhost.txt').toString(); // localhost

async function main() {
  const [owner, addr1, addr2, addr3] = await ethers.getSigners();
  console.log(owner);
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

  const ERC20 = await ethers.getContractFactory('ERC20');
  for (let coin of coins) {
    const erc20 = await ERC20.deploy("Wrapped Bitcoin", "WBTC");
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
