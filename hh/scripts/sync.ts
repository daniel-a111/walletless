import fs from 'fs';
import { ethers } from "hardhat";
import hre from "hardhat";
import {BigNumber} from 'ethers';
import { CoinTransfer, FeesAccount, SyncStatus } from "../src/models";

export const DEPLOYER_ADDRESS = fs.readFileSync('./deployments/localhost.txt').toString(); // localhost

let deployerAbi = [
  "event ScaaCreated(Walletless account, address initializer)",
];

interface Transfer {
  address: string;
  value: string;
  symbol: string;
}
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

async function main() {

  let sync: any = await SyncStatus.findOne();
  if (!sync) {
      sync = SyncStatus.build({blockNumber: -1});
  }

  const [owner] = await ethers.getSigners();
  let provider = owner.provider;
  const contract = new ethers.Contract(
      ethers.utils.getAddress(DEPLOYER_ADDRESS),
      new ethers.utils.Interface(deployerAbi),
      provider
  );
  
  let SCAAs = new Set<string>();
  let feesAccounts: any[] = await FeesAccount.findAll();
  for (let feesAccount of feesAccounts) {
      SCAAs.add(feesAccount.SCAA);
  }

  let currentBlockNumber: number = await provider?.getBlockNumber()||-1;
  console.log({currentBlockNumber})
  while (sync.blockNumber < currentBlockNumber) {
      console.log(`fetch block ${sync.blockNumber+1}`);
      let block: any = await provider?.getBlockWithTransactions(sync.blockNumber+1);
      console.log({block: block.number})
      for (let transaction of block?.transactions || []) {
          console.log(transaction);
          let receipt = await owner.provider?.getTransactionReceipt(transaction.hash);
          console.log({receipt});

          try {
              console.log(transaction.hash);
              const trace = await hre.network.provider.send("debug_traceTransaction", [
                  transaction.hash,
                  {
                    disableMemory: false,
                    disableStorage: false,
                    disableStack: false,
                    tracer: "callTracer"
                  },
                ]);
                console.log({trace})
              //   process.exit();
              let balanceChanges: any = {};
              balanceChanges[transaction.to] = transaction.value;
              balanceChanges[transaction.from] = BigNumber.from(0).sub(transaction.value);
              let erc20BalanceChanges: any = {};
              let currentContractAddress: string = transaction.to;
              if (receipt){
                process.exit(0);
              }
              if (trace) {
                console.log();
                process.exit();
              }
              for (let op of trace.structLogs) {
                  let stack = op.stack;
                  if (op.op === 'CALL' || op.call === 'CALLCODE') {
                      let collee = '0x'+stack[stack.length-2].substring(24);
                      let value = ethers.utils.parseEther(ethers.utils.formatEther('0x'+stack[stack.length-3]));
                      balanceChanges[currentContractAddress] = balanceChanges[currentContractAddress].sub(value);
                      if (!balanceChanges[collee]) {
                          balanceChanges[collee] = BigNumber.from(0);
                      }
                      balanceChanges[collee] = balanceChanges[collee].add(value);
                      console.log({op});
                      process.exit(0);
                  }
              }


              if (transaction.to === DEPLOYER_ADDRESS) {

                  // process.exit(0);
                  for (let op of trace.structLogs) {
                      let stack = op.stack;
                      if (op.op === 'LOG3') {
                          stack.pop()
                          stack.pop()
                          let topic = stack[stack.length-3];
                          let transfer_from = stack[stack.length-4];
                          let transfer_to = stack[stack.length-5];
                          let transfer_amount = stack[stack.length-6];
                          if (topic == TRANSFER_TOPIC) {
                              if (!erc20BalanceChanges[currentContractAddress]) {
                                  erc20BalanceChanges[currentContractAddress] = {};
                              }
                              if (!erc20BalanceChanges[currentContractAddress][transfer_from]) {
                                  erc20BalanceChanges[currentContractAddress][transfer_from] = BigNumber.from(0);
                              }
                              if (!erc20BalanceChanges[currentContractAddress][transfer_to]) {
                                  erc20BalanceChanges[currentContractAddress][transfer_to] = BigNumber.from(0);
                              }
                              erc20BalanceChanges[currentContractAddress][transfer_from] = erc20BalanceChanges[currentContractAddress][transfer_from].sub(transfer_amount);
                              erc20BalanceChanges[currentContractAddress][transfer_from] = erc20BalanceChanges[currentContractAddress][transfer_to].sub(transfer_amount);
                          }            
                      }
                  }
              }


              let transfers: Transfer[] = [];
              for (let address in balanceChanges) {
                  if (SCAAs.add(address)) {
                      let tr = CoinTransfer.build({
                          txHash: transaction.hash,
                          account: address,
                          value: ethers.utils.formatEther(balanceChanges[address]),
                          symbol: 'ETH',
                          time: new Date(block.timestamp*1000)
                      });
                      try {
                          await tr.save();
                      } catch(e) { 
                          // console.log(e)
                      }
                      transfers.push({
                          address, value: ethers.utils.formatEther(balanceChanges[address]),
                          symbol: 'ETH'
                      });    
                  }
              }
              
          } catch (e: any) {
            console.error(e)
            // process.exit(0);
          }

      }
      
      
      sync.blockNumber += 1;
      await sync.save();
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
