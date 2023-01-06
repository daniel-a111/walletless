import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { DEPOLYER_CONTRACT_NAME } from "../src/constants";
import { FeesAccount } from "../src/models";
import { DEPLOYER_ADDRESS } from "../src/controllers/provider";

async function main() {

    // let { feesAddress, gasLimit, maxFeePerGas, maxPriorityFeePerGas }: any = req.body;

    // feesAddress
    // : 
    // "0xd4dbd980ccbe9be11716b988275ea591c953e218"
    // maxFeePerGas
    // : 
    // 70000000000
    // maxPriorityFeePerGas
    // : 
    // 70000000000

    let feesAddress = '0x6df04020daf8a6b6bd3265c6cf53cf1425fa2108';
    let maxFeePerGas: any = 700000000000;
    let maxPriorityFeePerGas: any = 700000000000;
    let gasLimit = 3_500_000;
    maxFeePerGas = BigNumber.from(maxFeePerGas);
    maxPriorityFeePerGas = BigNumber.from(maxPriorityFeePerGas);
    let gasPrice = maxFeePerGas;

    console.log({ m: maxFeePerGas.mul(BigNumber.from(gasLimit)), maxFeePerGas, maxPriorityFeePerGas })
    
    // TODO cheap deploy
    const [owner] = await ethers.getSigners();
    const Depolyer = await ethers.getContractFactory(DEPOLYER_CONTRACT_NAME);
    const deployer = Depolyer.attach(DEPLOYER_ADDRESS);
    
    // try {
        let feesAccount: any = await FeesAccount.findOne({ where: { address: feesAddress } });
        // if (!feesAccount) {
        //     return res.status(500).json({ message: 'fee account missing or dont have balance' })
        // }
        let addr = new ethers.Wallet(feesAccount.PK, owner.provider);
        console.log({ feesAddress });
        // let tx = await deployer.connect(addr).createAccount({ gasLimit: 2_500_000, maxFeePerGas, maxPriorityFeePerGas });
        let tx = await deployer.connect(addr).createAccount({ gasLimit, maxFeePerGas, maxPriorityFeePerGas });
        console.log({tx});
    // } catch()
    // console.log(`Lock with 1 ETH and unlock timestamp ${unlockTime} deployed to ${lock.address}`);
}
console.log(process.argv);

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
// main().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });
