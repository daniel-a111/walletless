import { ethers } from "hardhat";
import { MIN_RGF, RGFM } from "../src/constants";
import { netedHash, passwordToCertAndNonce } from "../src/utils";
import {BigNumber} from 'ethers';

async function main() {

  const address = '0x51A1ceB83B83F1985a81C295d1fF28Afef186E02';
  const VALUE_STR = '0.0'

  let { cert: newCert, nonceSize: newNonceSize } = passwordToCertAndNonce("111");

  newCert = '0x'+newCert.digest('hex');

  let to = address;
  const TwoFactorWallet = await ethers.getContractFactory("TwoFactorWallet");
  const iface = TwoFactorWallet.interface;
  const a = iface.encodeFunctionData("resetPassword", [
    newCert,
    newNonceSize,
  ]);
  let data = a.substring(2);

  const wallet = await TwoFactorWallet.attach(address);
  let value = ethers.utils.parseEther(VALUE_STR);
  let gasLimit = iface.functions['resetPassword(bytes32,uint256)'].gas||21000;

  let nonce = parseInt(ethers.utils.formatUnits(await wallet.nonce(), 0));
  let nonceSize = parseInt(ethers.utils.formatUnits(await wallet.nonceSize(), 0));

  console.log({to})
  console.log({data});
  // await wallet.nonce();
  console.log({nonce});
  console.log({nonceSize});

  const gweiValue = MIN_RGF;

  let valueHex = value.toHexString().substring(2);
  let vhl = valueHex.length;
  for (let i = 0; i < 64-vhl; i++) {
    valueHex = '0'+valueHex;
  }

  let proof = netedHash("123123", nonceSize-nonce).digest('hex');
  console.log({proof})
  console.log('^^')
  console.log(to+valueHex+data+proof);
  let txCert = ethers.utils.sha256(to+valueHex+data+proof);
  data = '0x'+data;
  console.log(data);
  console.log('^^')
  await wallet.call(wallet.address, value, data, gasLimit, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
