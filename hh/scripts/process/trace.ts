import hre, { ethers } from "hardhat";
import { BigNumber } from 'ethers';
import { CoinTransfer, SCAA, SyncStatus } from "../../src/models";
var fs = require('fs')

const scaas = new Set();
const EXLCUDE_PCs = new Set([4473, 4564]);
async function main() {

  try {
    const [owner] = await ethers.getSigners();
    let provider = owner.provider;
  
    let sync: any = await SyncStatus.findOne();
    if (!sync) {
        sync = SyncStatus.build({blockNumber: -1});
    }
  
    let scaasList: any[] = await SCAA.findAll();
    for (let scaa of scaasList) {
      scaas.add(scaa.address)
    }
  
    let currentBlockNumber: number = await provider?.getBlockNumber()||-1;
    while (sync.blockNumber < currentBlockNumber) {
      console.log(`fetch block ${sync.blockNumber+1}`);
      let block: any = await provider?.getBlockWithTransactions(sync.blockNumber+1);
      console.log({block: block.number})
      let promises = [];
      for (let transaction of block?.transactions || []) {
        promises.push(handleTransaction(transaction.hash));
      }
      await Promise.all(promises);
      sync.blockNumber += 1;
      await sync.save();
    }
  
  } catch (e: any) {
    console.error(e);
  } finally {
    setTimeout(() => {
      main()
    }, 60*1000);
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



async function handleTransaction(txHash: string) {
  
  const [owner] = await ethers.getSigners();
  const provider = owner.provider;

  let tx = await provider?.getTransaction(txHash);
  let block = await provider?.getBlock(tx?.blockNumber||1000);
  let receipt = await provider?.getTransactionReceipt(txHash);
  console.log();
  if (tx?.value.gt('0')) {
    console.log({
      from: tx.from, to: tx.to, value: ethers.utils.formatEther(tx.value)
    })
  }
  
  await CoinTransfer.destroy({
    where: {txHash: tx?.hash, symbol: 'ETH'}
  });
  if (receipt?.status === 1) {
    const balanceChanges = await getAllEthTransfers(tx);
    await updateDatabase(tx?.hash||'', block?.timestamp||0, balanceChanges);  
  }
}

async function updateDatabase(txHash: string, timestamp: number, balanceChanges: any) {
  await CoinTransfer.destroy({where:{txHash}});
  for (let address in balanceChanges) {
    if (!balanceChanges[address].eq(0)) {
      let tr = CoinTransfer.build({
          txHash: txHash,
          account: address,
          value: ethers.utils.formatEther(balanceChanges[address]),
          symbol: 'ETH',
          time: new Date((timestamp||0)*1000)
      });
      await tr.save();
    }
  }
}

async function getAllEthTransfers(tx: any) {
  console.log(tx.hash);
  let from = tx?.to || '';
  const trace = await hre.network.provider.send("debug_traceTransaction", [
    tx.hash,
    {
      disableMemory: false,
      disableStuck: false,
      // tracer: "callTracer"
    },
  ]);
  const balanceChanges: any = {};
  if (!scaas.has(tx?.to) || !tx.data.startsWith('0x3df80e45') ) {
    balanceChanges[tx?.from||''] = BigNumber.from(0).sub(tx?.value || 0);
    balanceChanges[tx?.to||''] = tx?.value;
    // console.log(tx);
    // process.exit(0);
  }


  // var logger = fs.createWriteStream('log.txt', {
  //   flags: 'a' // 'a' means appending (old data will be preserved)
  // })
  
  const contractStack: (string|null)[] = [from];
  let lastCall: any = null;
  for (let log of trace.structLogs) {
    console.log({log});
    
    if (lastCall) {
      // console.log(log);
      if (log.stack[log.stack.length-1] === '0x0') {
        // failed
        balanceChanges[lastCall.from] = balanceChanges[lastCall.from].add(lastCall.value);
        balanceChanges[lastCall.to] = balanceChanges[lastCall.to].sub(lastCall.value);
      }
      lastCall = null;
    }
    // console.log(JSON.stringify(log, true, 4)+'\n');
    if (log.op == 'CALL') {

      if (scaas.has(contractStack[contractStack.length-1])) { // in scaa {
        if (EXLCUDE_PCs.has(log.pc)) {
          continue;
        }
      }
      let to = log.stack[log.stack.length-2];
      let value = log.stack[log.stack.length-3];
      let argSize = parseInt(log.stack[log.stack.length-5], 16);

      if (!balanceChanges[from]) {
        balanceChanges[from] = BigNumber.from(0)
      }
      if (!balanceChanges[to]) {
        balanceChanges[to] = BigNumber.from(0)
      }
      balanceChanges[from] = balanceChanges[from].sub(value);
      balanceChanges[to] = balanceChanges[to].add(value);
      console.log({
        from, to, value: ethers.utils.formatEther(value), argSize
      })
      
      if (argSize > 0) {
        contractStack.push(from);
        from = to;
      }
      lastCall = {
        from, to, value
      };
    } else if (log.op == 'CREATE') {
      contractStack.push(null);
    } else if (log.op == 'RETURN') {
      let exist = contractStack.pop();
      if (exist) {
        from = exist;
      }
    } else if (log.op === 'REVERT') {
      // process.exit(0);
      return {};
    }
  }

  if (trace?.structLogs?.length > 0) {
    // logger.end();
    // process.exit(0);
  }
  return balanceChanges;
}


