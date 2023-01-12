import fs from 'fs';
import hre, { ethers } from "hardhat";
import { BigNumber } from 'ethers';
import { CoinTransfer, GasStop, logEvents, NoneMatches, ResetCert, SCAA, Skip, SyncStatus, TxDone, TxReverted } from "../src/models";
import { parse } from 'dotenv';

const coins: any[] = JSON.parse(fs.readFileSync("./coins.json").toString());
const coinMap: any = {};

for (let coin of coins) {
  coinMap[coin.address] = coin;
}

const blocksMap: any = {};

async function main() {
  const [owner] = await ethers.getSigners();
  let provider = owner.provider;

  await Skip.destroy({ where: {} });
  await GasStop.destroy({ where: {} });
  await NoneMatches.destroy({ where: {} });
  await TxDone.destroy({ where: {} });
  await TxReverted.destroy({ where: {} });
  await ResetCert.destroy({ where: {} });

  let sync: any = await SyncStatus.findOne();
  if (!sync) {
      sync = SyncStatus.build({blockNumber: -1});
  }

  const abi = [
    "event Transfer(address indexed src, address indexed dst, uint val)"
  ];
  
  const walletlessABI = [
    "event Skip(bytes32 nonce)",
    "event NoneMatches(bytes32 nonce)",
    "event TxDone(bytes32 nonce, address to, uint value, bytes data)",
    "event TxReverted(bytes32 nonce, address to, uint value, bytes data, string message)",
    "event GasStop()",
    "event ResetCert(uint certCounter, bytes32 indexed oldCert, bytes32 indexed newCert)"
  ];
  
  const intrfc = new ethers.utils.Interface(abi);

  const intrfcWalletless = new ethers.utils.Interface(walletlessABI);

  // let transactionHashToBlockNumber: any = {};
  const loadLogs = async (contract: any, provider: any, event: string) => {
    let filters = contract.filters[event]();
    let logs: any[] = await provider.getLogs({...filters, fromBlock: 0});
    return logs;
  }

  const txDone: any = {};

  const scaas: any[] = await SCAA.findAll({raw: true});
  for (const scaa of scaas) {
    txDone[scaa.account] = {};
    if (provider) {
      let contract = new ethers.Contract(scaa.address, walletlessABI, provider);
      let logs = await loadLogs(contract, provider, 'TxDone');
      logs = [...logs, ...await loadLogs(contract, provider, 'NoneMatches')];
      logs = [...logs, ...await loadLogs(contract, provider, 'TxDone')];
      logs = [...logs, ...await loadLogs(contract, provider, 'TxReverted')];
      logs = [...logs, ...await loadLogs(contract, provider, 'GasStop')];
      logs = [...logs, ...await loadLogs(contract, provider, 'ResetCert')];
      logs = logs.sort((a: any, b: any) => a.blockNumber - b.blockNumber);

      let s = new Set<string>();
      for (let log of logs) {
        console.log({log});
        if (s.has(`${log.transactionHash}${log.logIndex}`)) {
          continue;
        }
        s.add(`${log.transactionHash}${log.logIndex}`);
        let blockNumber: number = log.blockNumber;
        if (!blocksMap[blockNumber]) {
          blocksMap[blockNumber] = (await provider.getBlock(blockNumber)).timestamp;
        }
        let parsed: any = intrfcWalletless.parseLog(log);
        let txHash = log.transactionHash;
        let logIndex = log.logIndex;
        let account = scaa.address;
        let data: any = {
          account, blockNumber, txHash, logIndex
        };
        for (let key in parsed.args) {
          let k: any = key;
          if (!isNaN(k)) {
            continue;
          }
          if (parsed.args[key] instanceof BigNumber) {
              data[key] = ethers.utils.formatEther(parsed.args[key]);
          } else {
            data[key] = parsed.args[key];
          }
        }

        const GAS_STOP_TOPIC = '0xd4f520b83665db9fd5879d40603a88a84700a184a6de88212d8a3799decdfeb3';
        if (txDone[scaa.account][parsed.args.cert]
            && txDone[scaa.account][parsed.args.cert].topics[0] !== GAS_STOP_TOPIC
            && log.topics[0] !== GAS_STOP_TOPIC) {
          console.log(txDone[scaa.account][parsed.args.cert]);
          console.log('vs');
          console.log(log);
          // process.exit(0);
        }
        txDone[scaa.account][parsed.args.cert] = log;
        let logEvent: any = logEvents(parsed.name, data);
        await logEvent.save();
        let op = null;
        // console.log({parsed, scaa});
        // console.log(parsed.args.src === scaa.address);
        // console.log(parsed.args.dst === scaa.address);
      }
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



