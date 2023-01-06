import { ethers } from "hardhat";

const hash = '0x50dbcb6a3f71a8cd27db5679684c69bf203c24d37f2e741bf4287cb8a1317d7e';
async function main() {

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    let provider = owner.provider;

    let tx = await provider?.getTransaction(hash);
    console.log({ tx });
    let reciept = await provider?.getTransactionReceipt(hash);
    console.log({ reciept });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
