import fs from 'fs';
import hre, { ethers } from "hardhat";
import { BigNumber } from 'ethers';
import { CoinTransfer, SCAA, SyncStatus } from "../../src/models";
import { parse } from 'dotenv';

const coins: any[] = JSON.parse(fs.readFileSync("./coins.json").toString());
const coinMap: any = {};

for (let coin of coins) {
  coinMap[coin.address] = coin;
}

const blocksMap: any = {};

async function main() {

  try {

    const [owner] = await ethers.getSigners();
    let provider = owner.provider;

    let sync: any = await SyncStatus.findOne();
    if (!sync) {
        sync = SyncStatus.build({blockNumber: -1});
    }

    const abi = [
      "event Transfer(address indexed src, address indexed dst, uint val)"
    ];
    const intrfc = new ethers.utils.Interface(abi);

    let byCoin: any = {};
    let transactionHashToBlockNumber: any = {};
    for (let coin of coins) {

      const byAddress: any = {};
      byCoin[coin.address] = byAddress;

      let contract = new ethers.Contract(coin.address, abi, provider);
      const scaas: any[] = await SCAA.findAll({raw: true});
      for (const scaa of scaas) {
        let byTransaction: any = {};
        byAddress[scaa.address] = byTransaction;
      }
      // console.log({scaas})
      for (const scaa of scaas) {
        let filters = contract.filters.Transfer(scaa.address);
        if (provider) {
          let logs: any[] = await provider.getLogs({...filters, fromBlock: 0});
          filters = contract.filters.Transfer(null, scaa.address);
          for (let log of await provider.getLogs({...filters, fromBlock: 0})) {
            logs.push(log);
          }

          for (let log of logs) {

            let txHash: string = log.transactionHash;
            let blockNumber: number = log.blockNumber;
            let byTransaction = byAddress[scaa.address];
            if (!byTransaction[txHash]) {
              byTransaction[txHash] = BigNumber.from(0);
            }
            transactionHashToBlockNumber[txHash] = blockNumber;
            if (!blocksMap[blockNumber]) {
              blocksMap[blockNumber] = (await provider.getBlock(blockNumber)).timestamp;
            }
            let parsed: any = intrfc.parseLog(log);
            let op = null;
            console.log({parsed, scaa});
            console.log(parsed.args.src === scaa.address);
            console.log(parsed.args.dst === scaa.address);

            if (parsed.args.src === scaa.address) {
              byTransaction[txHash] = byTransaction[txHash].sub(parsed.args.val);
            } else if (parsed.args.dst === scaa.address) {
              byTransaction[txHash] = byTransaction[txHash].add(parsed.args.val);
            }
          }
        }
      }
    }

    // console.log({byCoin});
    for (let coinAddress in byCoin) {
      let byAccount = byCoin[coinAddress];
      for (let account in byAccount) {
        let byTransaction = byAccount[account];
        for (let txHash in byTransaction) {
          await CoinTransfer.destroy({where: {
            txHash, coinAddress, account
          }});
          let value = ethers.utils.formatEther(byTransaction[txHash]);
          let ct = CoinTransfer.build({
            txHash, account, value, coinAddress, 
            symbol: coinMap[coinAddress].symbol,
            time: new Date((blocksMap[transactionHashToBlockNumber[txHash]]||0)*1000)
          });
          await ct.save();
        }
      }
    }
  } catch (e: any) {
      console.error(e);
  } finally {
    setTimeout(() => {
        main();
    }, 60*1000);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



