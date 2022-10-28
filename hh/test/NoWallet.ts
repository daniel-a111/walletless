import { ethers } from "hardhat";
import {BigNumber} from 'ethers';
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { netedHash, passwordAndAddressToCertAndNonce, sha256 } from "../src/utils";
import { MIN_RGF, RGF, RGFM } from "../src/constants";

export const passwordsAndAddressAndCertAndNonceToProof = (password: string, address: string, cert: string, nonce: number, nonceSize: number) => {
  let p1: any = sha256(`${password}${address}`);
  for (let i = nonce+1; i < nonceSize; i++) {
      p1 = sha256(p1.digest());
  }
  let h1 = sha256(p1.digest()).digest('hex');
  console.log({h1});
  if (h1 === cert) {
      return p1.digest('hex');
  }
  return undefined;
}

const signTransactionAndProof = (tx: any, proof: string) => {
  let { to, value, data }: any = tx;
  data = data.substring(2);
  let valueHex = value.toHexString().substring(2);
  let vhl = valueHex.length;
  for (let i = 0; i < 64-vhl; i++) {
    valueHex = '0'+valueHex;
  }
  console.log({ perc: to+valueHex+data+proof })
  console.log(to+valueHex+data+proof)
  let txCert = ethers.utils.sha256(to+valueHex+data+proof);
  return { txCert };
}

describe("No-Wallet Account", async () => {

  const deployOneMinuteDelayVault = async () => {
    const TwoFactorWallet = await ethers.getContractFactory("WalletLess");

    // console.log(TwoFactorWallet);
    // console.log(TwoFactorWallet.bytecode)
    // console.log(TwoFactorWallet.interface._abiCoder)
    // const iface = TwoFactorWallet.interface;
    // console.log({ iface })

    
    // let a = iface.encodeFunctionData("resetPassword", [
    //   "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    //   "0xaB7C8803962c0f2F5BBBe3FA8bf41cd82AA1923C",
    //   ethers.utils.parseEther("1.0")
    // ])
    // console.log({ a })
    // console.log(TwoFactorWallet.interface.functions['resetPassword(bytes32,uint256,bytes32)'])
    const wallet = await TwoFactorWallet.deploy();
    return { wallet };
  };

  const deployRGFMProvider = (owner: any) => {

    return async () => {
      const [owner, addr1, addr2, addr3] = await ethers.getSigners();
      const ManualRGFProvider = await ethers.getContractFactory("ManualRGFProvider");
      const RGFProvider = await ManualRGFProvider.deploy(owner.address, RGF, RGFM, MIN_RGF);
      return { RGFProvider };  
    };
  };

  it("Deploy with passwords", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    let { wallet } = await loadFixture(deployOneMinuteDelayVault);
    // const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const ManualRGFProvider = await ethers.getContractFactory("ManualRGFProvider");
    const RGFProvider = await ManualRGFProvider.deploy(wallet.address, RGF, RGFM, MIN_RGF);

    const PASSWORD = '123123';
    let { cert, nonceSize } = passwordAndAddressToCertAndNonce(PASSWORD, wallet.address);
    await wallet.init('0x'+cert, nonceSize, RGFProvider.address);
    await wallet.topup({ value: ethers.utils.parseEther("9.") });

    let to = addr1.address;
    let value = ethers.utils.parseEther("8.");
    let proof = passwordsAndAddressAndCertAndNonceToProof(PASSWORD, wallet.address, cert, await wallet.nonce(), nonceSize);

    console.log({cert})
    let data = '';
    let {txCert} = signTransactionAndProof({ to, data, value }, proof||'');
    console.log({ txCert });
    // let proofHex: any = netedHash("123123", nonceSize-1).digest('hex');
    // let proof = netedHash("123123", nonceSize-1).digest('hex');
    const gweiValue = MIN_RGF;
    // let txCert = ethers.utils.sha256(to+'0000000000000000000000000000000000000000000000'+value.toHexString().substring(2)+''+proofHex);
    await wallet.call(addr1.address, value, [], txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
    console.log({proof});

    console.log('TET');
    console.log(await wallet.verifyRecord(0, `0x${proof}`));

    await wallet.expose('0x'+proof, 0);
    console.log();
    console.log({ balance: ethers.utils.formatEther(await owner.getBalance()) })
    console.log({ balance: ethers.utils.formatEther(await addr1.getBalance()) })
    console.log({ balance: ethers.utils.formatEther(await wallet.provider.getBalance(wallet.address)) })
  });


  // it("First is the taker", async function () {
  //   const [owner, addr1, addr2, addr3] = await ethers.getSigners();
  //   let { wallet } = await loadFixture(deployOneMinuteDelayVault);
  //   let { cert, nonceSize } = passwordToCertAndNonce("123123");
  //   let certDigest = cert.digest();
    
  //   const ManualRGFProvider = await ethers.getContractFactory("ManualRGFProvider");
  //   const RGFProvider = await ManualRGFProvider.deploy(wallet.address, RGF, RGFM, MIN_RGF);

  //   await wallet.init( certDigest, nonceSize, RGFProvider.address);
  //   await wallet.topup({ value: ethers.utils.parseEther("9000.") });

  //   let to = addr1.address;
  //   let value = ethers.utils.parseEther("1000.");
  //   console.log(value.toString());
  //   console.log(value.toHexString());
  //   let proof = netedHash("123123", nonceSize-1).digest('hex');
  //   let txCert = ethers.utils.sha256(to+'0000000000000000000000000000000000000000000000'+value.toHexString().substring(2)+''+proof);
  //   const gweiValue = MIN_RGF;
  //   await wallet.call(addr1.address, value, [], 40000, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });

  //   value = ethers.utils.parseEther("100.");
  //   proof = netedHash("123123", nonceSize-1).digest('hex');
  //   cert = ethers.utils.sha256(to+'0000000000000000000000000000000000000000000000'+value.toHexString().substring(2)+''+proof);
  //   await wallet.call(addr1.address, value, [], 40000, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });

  //   await wallet.expose('0x'+proof);
  //   console.log({ balance: ethers.utils.formatEther(await addr1.getBalance()) })
  // });

  // it("Wallet-less", async function () {
  //   const [owner, addr1, addr2, addr3] = await ethers.getSigners();
  //   let { wallet } = await loadFixture(deployOneMinuteDelayVault);
  //   let { cert, nonceSize } = passwordToCertAndNonce("123123");
  //   let certDigest = cert.digest();

  //   const ManualRGFProvider = await ethers.getContractFactory("ManualRGFProvider");
  //   const RGFProvider = await ManualRGFProvider.deploy(wallet.address, RGF, RGFM, MIN_RGF);

  //   await wallet.init( certDigest, nonceSize, RGFProvider.address);
  //   await wallet.topup({ value: ethers.utils.parseEther("9000.") });

  //   let to = addr1.address;
  //   let proof = netedHash("123123", nonceSize-1).digest('hex');
  //   let value = ethers.utils.parseEther("0.000000000000000001");
  //   let valueHex = value.toHexString().substring(2);
  //   const gweiValue = MIN_RGF;

  //   let vhl = valueHex.length;
  //   for (let i = 0; i < 64-vhl; i++) {
  //     valueHex = '0'+valueHex;
  //   }
  //   let txCert = ethers.utils.sha256(to+valueHex+''+proof);
  //   await wallet.connect(addr2).call(addr1.address, value, [], 40000, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
  //   await wallet.connect(addr3).expose('0x'+proof);
  //   console.log({ balance: ethers.utils.formatEther(await addr1.getBalance()) });
  // });

  // it("Change passwords", async function () {
  //   const [owner, addr1, addr2, addr3] = await ethers.getSigners();
  //   let { wallet } = await loadFixture(deployOneMinuteDelayVault);
  //   let { cert, nonceSize } = passwordToCertAndNonce("123123");
  //   let certDigest = cert.digest();

  //   const ManualRGFProvider = await ethers.getContractFactory("ManualRGFProvider");
  //   const RGFProvider = await ManualRGFProvider.deploy(wallet.address, RGF, RGFM, MIN_RGF);

  //   let { cert: c1, nonceSize: ns1 } = passwordToCertAndNonce("123123");

  //   console.log({ c1: c1.digest('hex') });
  //   await wallet.init( certDigest, nonceSize, RGFProvider.address);

  //   let { cert: certNew, nonceSize: nonceSizeNew } = passwordToCertAndNonce("111");
  //   const TwoFactorWallet = await ethers.getContractFactory("TwoFactorWallet");
  //   const iface = TwoFactorWallet.interface;

  //   let a = iface.encodeFunctionData("resetPassword", [
  //     '0x'+certNew.digest('hex'),
  //     nonceSizeNew,
  //     // proofBytesx
  //   ]);
  //   let b = iface.encodeFunctionData("topup", [])
  //   console.log({ b })
  //   {
  //     // console.log(iface.functions['resetPassword(bytes32,uint256,bytes32)'].gas);
  //     let gasLimit = iface.functions['resetPassword(bytes32,uint256)'].gas||21000;
  //     console.log(iface.functions['resetPassword(bytes32,uint256)']);
  //     let to = wallet.address;
  //     let proof = netedHash("123123", nonceSize).digest('hex');  
  //     console.log({ proof });
  //     let value = ethers.utils.parseEther("0.");
  //     let valueHex = value.toHexString().substring(2);
  //     let vhl = valueHex.length;
  //     for (let i = 0; i < 64-vhl; i++) {
  //       valueHex = '0'+valueHex;
  //     }
  //     // console.log({valueHex});
  //     // console.log(wallet.address+valueHex+(a.substring(2))+proof);
  //     let txCert = ethers.utils.sha256(wallet.address+valueHex+(a.substring(2))+proof);
  //     let txCert2 = ethers.utils.sha256(wallet.address+valueHex+(a.substring(2))+proof);

  //     console.log({ address: wallet.address });
  //     console.log({ valueHex });
  //     console.log({ data: a.substring(2) });
      
  //     console.log({ perc: wallet.address+valueHex+(a.substring(2))+proof });
  //     console.log({ txCert2: txCert2 });
  //     const gweiValue = MIN_RGF;
  //     console.log(gasLimit);
  //     await wallet.call(wallet.address, value, a, gasLimit, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
  //     // await wallet.connect(addr3).expose('0x'+proof);
  //   }

  //   // console.log('\n\n')
  //   // await wallet.topup({ value: ethers.utils.parseEther("9000.") });

  //   // let to = addr1.address;
  //   // let proof = netedHash("111", nonceSizeNew).digest('hex');
  //   // // let { cert: certNew1, nonceSize: nonceSizeNew1 } = passwordToCertAndNonce("111");

  //   // console.log({ proof })
  //   // console.log({ next: ethers.utils.sha256('0x'+proof) })
  //   // // console.log({ cn: certNew1.digest('hex') })
  //   // let value = ethers.utils.parseEther("1.");
  //   // let valueHex = value.toHexString().substring(2);
  //   // const gweiValue = MIN_RGF;

  //   // let vhl = valueHex.length;
  //   // for (let i = 0; i < 64-vhl; i++) {
  //   //   valueHex = '0'+valueHex;
  //   // }
  //   // let txCert = ethers.utils.sha256(to+valueHex+''+proof);
  //   // await wallet.connect(addr2).call(addr1.address, value, [], 40000, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
  //   // await wallet.connect(addr3).expose('0x'+proof);
  //   // console.log({ balance: ethers.utils.formatEther(await addr1.getBalance()) });
  // });


  // it("Change gas parameters", async function () {
  //   const [owner, addr1, addr2, addr3] = await ethers.getSigners();
  //   let { wallet } = await loadFixture(deployOneMinuteDelayVault);
  //   let { cert, nonceSize } = passwordToCertAndNonce("123123");
  //   let certDigest = cert.digest();

  //   const ManualRGFProvider = await ethers.getContractFactory("ManualRGFProvider");
  //   const RGFProvider = await ManualRGFProvider.deploy(wallet.address, RGF, RGFM, MIN_RGF);

  //   let { cert: c1, nonceSize: ns1 } = passwordToCertAndNonce("123123");


    
  //   console.log({ c1: c1.digest('hex') });
  //   await wallet.init( certDigest, nonceSize, RGFProvider.address);

  //   // let { cert: certNew, nonceSize: nonceSizeNew } = passwordToCertAndNonce("111");
  //   const TwoFactorWallet = await ethers.getContractFactory("WalletLess");
  //   const ifaceRGF = ManualRGFProvider.interface;
  //   const iface = TwoFactorWallet.interface;

  //   let data = ifaceRGF.encodeFunctionData("set", [
  //     1,
  //     1,
  //     1
  //   ]);


  //   let a = iface.encodeFunctionData("call", [
  //     RGFProvider.address,
  //     ethers.utils.parseEther('0.0'),
  //     data,

  //   ]);


  //   // // let b = iface.encodeFunctionData("topup", [])
  //   // // console.log({ b })
  //   // {
  //   //   // console.log(iface.functions['resetPassword(bytes32,uint256,bytes32)'].gas);
  //   //   let gasLimit = iface.functions['resetPassword(bytes32,uint256)'].gas||21000;
  //   //   console.log(iface.functions['resetPassword(bytes32,uint256)']);
  //   //   let to = wallet.address;
  //   //   let proof = netedHash("123123", nonceSize).digest('hex');  
  //   //   console.log({ proof });
  //   //   let value = ethers.utils.parseEther("0.");
  //   //   let valueHex = value.toHexString().substring(2);
  //   //   let vhl = valueHex.length;
  //   //   for (let i = 0; i < 64-vhl; i++) {
  //   //     valueHex = '0'+valueHex;
  //   //   }
  //   //   // console.log({valueHex});
  //   //   // console.log(wallet.address+valueHex+(a.substring(2))+proof);
  //   //   let txCert = ethers.utils.sha256(wallet.address+valueHex+(a.substring(2))+proof);
  //   //   let txCert2 = ethers.utils.sha256(wallet.address+valueHex+(a.substring(2))+proof);

  //   //   console.log({ address: wallet.address });
  //   //   console.log({ valueHex });
  //   //   console.log({ data: a.substring(2) });
      
  //   //   console.log({ perc: wallet.address+valueHex+(a.substring(2))+proof });
  //   //   console.log({ txCert2: txCert2 });
  //   //   const gweiValue = MIN_RGF;
  //   //   console.log(gasLimit);
  //   //   await wallet.call(wallet.address, value, a, gasLimit, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
  //   //   // await wallet.connect(addr3).expose('0x'+proof);
  //   // }

  //   // console.log('\n\n')
  //   // await wallet.topup({ value: ethers.utils.parseEther("9000.") });

  //   // let to = addr1.address;
  //   // let proof = netedHash("111", nonceSizeNew).digest('hex');
  //   // // let { cert: certNew1, nonceSize: nonceSizeNew1 } = passwordToCertAndNonce("111");

  //   // console.log({ proof })
  //   // console.log({ next: ethers.utils.sha256('0x'+proof) })
  //   // // console.log({ cn: certNew1.digest('hex') })
  //   // let value = ethers.utils.parseEther("1.");
  //   // let valueHex = value.toHexString().substring(2);
  //   // const gweiValue = MIN_RGF;

  //   // let vhl = valueHex.length;
  //   // for (let i = 0; i < 64-vhl; i++) {
  //   //   valueHex = '0'+valueHex;
  //   // }
  //   // let txCert = ethers.utils.sha256(to+valueHex+''+proof);
  //   // await wallet.connect(addr2).call(addr1.address, value, [], 40000, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
  //   // await wallet.connect(addr3).expose('0x'+proof);
  //   // console.log({ balance: ethers.utils.formatEther(await addr1.getBalance()) });
  // });
});


