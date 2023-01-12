import hre, { ethers } from "hardhat";
import { BigNumber } from 'ethers';
import { CoinTransfer, SCAA, SyncStatus } from "../../src/models";
import fs from 'fs';

export const DEPLOYER_ADDRESS = fs.readFileSync('./deployments/localhost.txt').toString(); // localhost

async function main() {

  try {
    const [owner] = await ethers.getSigners();
    let provider = owner.provider;

    const abi = [
      "event ScaaCreated(address account, address initializer)"
    ];
    const intrfc = new ethers.utils.Interface(abi);

    if (provider) {
      let contract = new ethers.Contract(DEPLOYER_ADDRESS, abi, provider);
      // List all token transfers *from* myAddress
      let filters: any = contract.filters.ScaaCreated();
      filters.fromBlock = 0;
      console.log({filters});
    
      let logs = await provider.getLogs(filters);
      console.log({logs})
      for (let log of logs) {
        console.log({log});
        let parsed = intrfc.parseLog(log);
        await (SCAA.build({address: parsed.args.account, 
          deployTime: new Date() // TODO fix
        })).save();
        // Emitted any token is sent TO either address
        // console.log({log, event});
        // log = intrfc.parseLog(log);
        console.log({log: intrfc.parseLog(log)});
      }
    }


    // let sync: any = await SyncStatus.findOne();
    // if (!sync) {
    //     sync = SyncStatus.build({blockNumber: -1});
    // }

    // let currentBlockNumber: number = await provider?.getBlockNumber()||-1;
    // console.log(`current block ${currentBlockNumber}`);

    // while (sync.blockNumber < currentBlockNumber) {
    //   console.log(`current block ${currentBlockNumber}`);
    //   console.log(`fetch block ${sync.blockNumber+1}`);
    //   let block: any = await provider?.getBlockWithTransactions(sync.blockNumber+1);
    //   console.log({block: block.number})
    //   let promises = [];
    //   for (let transaction of block?.transactions || []) {
    //     promises.push(handleTransaction(transaction.hash));
    //   }
    //   await Promise.all(promises);
    //   sync.blockNumber += 1;
    //   await sync.save();
    // }
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



async function handleTransaction(txHash: string) {
  
  const [owner] = await ethers.getSigners();
  const provider = owner.provider;

  let tx = await provider?.getTransaction(txHash);
  let block = await provider?.getBlock(tx?.blockNumber||1000);

  if (tx?.value.gt('0')) {
    console.log({
      from: tx.from, to: tx.to, value: ethers.utils.formatEther(tx.value)
    })
  }

  const balanceChanges = await getAllEthTransfers(tx);
  await updateDatabase(tx?.hash||'', block?.timestamp||0, balanceChanges);
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
  balanceChanges[tx?.from||''] = BigNumber.from(0).sub(tx?.value || 0);
  balanceChanges[tx?.to||''] = tx?.value;

  const contractStack: (string|null)[] = [from];
  for (let log of trace.structLogs) {
  
    if (log.op == 'CALL') {
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
    } else if (log.op == 'CREATE') {
      contractStack.push(null);
    } else if (log.op == 'RETURN') {
      let exist = contractStack.pop();
      if (exist) {
        from = exist;
      }
    }
  }
  return balanceChanges;
}


