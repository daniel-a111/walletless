import { ethers } from "hardhat";

async function main() {

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    console.log(process.argv);

    let provider = owner.provider;

    // Acccounts now exposed
    const params = {
        from: owner.address,
        to: '0xaca8de99d892f7872e28572730bbeb4112a37f7b',
        value: ethers.utils.parseUnits('8', 'ether').toHexString()
    };

    if (provider) {
        const transactionHash = await owner.sendTransaction(params);
        console.log(transactionHash);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
