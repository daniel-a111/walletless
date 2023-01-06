// import { ethers } from "hardhat";
// import {BigNumber} from 'ethers';
// import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
// import { sha256 } from "../src/utils";

// function to32bytes(hex: string) {
//   if (hex.startsWith('0x'))
//     hex = hex.substring(2);
//   for (let i = hex.length; i<64; i++)
//     hex = '0'+hex;
//   return hex;
// }
// function toHex(bn: BigNumber) {
//   return to32bytes(bn.toHexString());
// }
// function searchRandom(hex: string) {
//   // let hex = '00000000000000000000000000000000000000000000000000000000000000000';
//   let nonce = 0;
//   console.log({hex});
//   let bn = BigNumber.from(hex);
//   console.log({bn});
//   let start = new Date().getTime();
//   while(true) {
//     if (nonce%1_000_000===0) {
//       // console.log(`nonce: ${nonce}`)
//     }
//     let next: BigNumber = bn.add(nonce);
//     let r = sha256(Buffer.from(toHex(next), 'hex')).digest('hex');
    
//     if (r.startsWith('00000')) {
//       let end = new Date().getTime();
//       console.log({se: (end-start)/1000})
//       console.log(r);
//       return nonce;
//     }
//     nonce++;
//   }
// }
// describe("No-Wallet Account", async () => {

//   const deploy = async () => {
//     const [owner, addr1, addr2, addr3] = await ethers.getSigners();

//     const RandomizerGov = await ethers.getContractFactory('Gov');
//     await RandomizerGov.deploy(addr2.address, addr3.address);

//     const Randomizer = await ethers.getContractFactory('RandomDAO');
//     const randomizer = await Randomizer.deploy();
//     const { coin } = await loadCoin(await randomizer.coin());

//     const Staking = await ethers.getContractFactory('Staking');
//     const staking = await Staking.deploy(coin.address);

//     await randomizer.set_staking(staking.address);

//     return { randomizer, coin, staking };
//   };

//   const loadCoin = async (address: string) => {
//     // const [owner, addr1, addr2, addr3] = await ethers.getSigners();
//     const RNDM = await ethers.getContractFactory('RNDM');
//     const coin = RNDM.attach(address);
//     return { coin };
//   };

//   it("State test", async function () {
//     const [owner, addr1, addr2, addr3] = await ethers.getSigners();

//     let { randomizer, coin, staking } = await loadFixture(deploy);


//     // await randomizer.setHalving(BigNumber.from("1"));
//     // let { coin } = await loadCoin(await randomizer.getCoin());

//     // console.log({coin});
//     let balance = await coin.balanceOf(owner.address);
//     console.log({balance: ethers.utils.formatEther(balance)});

//     let targetBalance = ethers.utils.parseEther("100.0");
//     await randomizer.burn(owner.address, balance.sub(targetBalance));
//     balance = await coin.balanceOf(owner.address);
//     console.log({balance: ethers.utils.formatEther(balance)});

//     balance = await coin.balanceOf(addr1.address);
//     balance = ethers.utils.formatEther(balance);
//     console.log({balance});

//     let seed = await randomizer.connect(addr1).seed();
//     console.log({seed})
//     let start = new Date().getTime();
//     await randomizer.connect(addr1).mine(BigNumber.from(searchRandom(seed)));
//     let end = new Date().getTime();
//     console.log({se: end-start})
//     await coin.approve(staking.address, ethers.utils.parseEther('10'));
//     await staking.stake(ethers.utils.parseEther('10'));

//     let random = ethers.utils.formatUnits(await randomizer.random(1), 0);
//     console.log({random});

//     balance = await coin.balanceOf(addr1.address);
//     balance = ethers.utils.formatEther(balance);
//     console.log({balance});

//     let ethBalance, lastEthBalance;
//     ethBalance = await addr1.getBalance();
//     lastEthBalance = ethBalance;
//     ethBalance = ethers.utils.formatEther(ethBalance);
//     console.log({ethBalance})
//     seed = await randomizer.connect(addr1).seed();
//     await randomizer.connect(addr1).mine(BigNumber.from(searchRandom(seed)));

//     balance = await coin.balanceOf(addr1.address);
//     balance = ethers.utils.formatEther(balance);

//     ethBalance = await addr1.getBalance();
//     let diff = lastEthBalance.sub(ethBalance);
//     ethBalance = ethers.utils.formatEther(ethBalance);
//     console.log({ethBalance})
//     console.log({diff: ethers.utils.formatEther(diff)})

//     console.log({balance});

//     seed = await randomizer.connect(addr1).seed();
//     let tx = await randomizer.connect(addr1).mine(BigNumber.from(searchRandom(seed)));
//     console.log({tx});
//     let receipt = await addr1.provider?.getTransactionReceipt(tx.hash);
//     console.log({receipt, gas: ethers.utils.formatEther(receipt?.gasUsed.mul(tx.gasPrice)||BigNumber.from('0'))});

//     // balance = await coin.balanceOf(addr1.address);
//     // balance = ethers.utils.formatEther(balance);
//     // console.log({balance});

//     // seed = await randomizer.connect(addr1).seed();
//     // await randomizer.connect(addr1).mine(BigNumber.from(searchRandom(seed)));

//     // balance = await coin.balanceOf(addr1.address);
//     // balance = ethers.utils.formatEther(balance);
//     // console.log({balance});

//     // seed = await randomizer.connect(addr1).seed();
//     // await randomizer.connect(addr1).mine(BigNumber.from(searchRandom(seed)));

//     // balance = await coin.balanceOf(addr1.address);
//     // balance = ethers.utils.formatEther(balance);
//     // console.log({balance});

//     // balance = await coin.balanceOf(addr1.address);
//     // balance = ethers.utils.formatEther(balance);
    

//     // await randomizer.unstake(ethers.utils.parseEther('10'));
//     // random = ethers.utils.formatUnits(await randomizer.random(1), 0);
//     // console.log({random});

//     // console.log();
//     // console.log(searchRandom());
//     // console.log({randomizer})
//     // console.log({ state: await wallet.getState() })
//     // let to = addr1.address;
//     // let value = ethers.utils.parseEther("8.");
//     // let data = '';

//     // let proof = passwordsAndAddressAndCertAndNonceToProof(PASSWORD, wallet.address, cert, await wallet.nonce(), nonceSize);
//     // let {txCert} = signTransactionAndProof({ to, data, value }, proof||'');

//     // const gweiValue = MIN_RGF;
//     // await wallet.call(addr1.address, value, [], txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });

//     // let pending = (await wallet.getState()).pending;
//     // // console.log({ state: (await wallet.getState()).pending })
//     // for (let i = 0; i < pending.length; i++) {
//     //   console.log(pending[0])
//     // }

//     // await wallet.expose(proof, 0);
//     // console.log({ state: await wallet.getState() })

//     // console.log({ balance: ethers.utils.formatEther(await owner.getBalance()) })
//     // console.log({ balance: ethers.utils.formatEther(await addr1.getBalance()) })
//     // console.log({ balance: ethers.utils.formatEther(await wallet.provider.getBalance(wallet.address)) })
//   });

// });


