import { ethers } from "hardhat";
import {BigNumber} from 'ethers';
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { passwordAndAddressToCertAndNonce, sha256 } from "../src/utils";
import { CONTRACT_NAME, MIN_RGF, RGF, RGFM, RGF_MANUAL_CONTRACT_NAME } from "../src/constants";

export const passwordsAndAddressAndCertAndNonceToProof = (password: string, address: string, cert: string, nonce: number, nonceSize: number) => {
  let p1: any = sha256(`${password}${address}`);
  for (let i = nonce+1; i < nonceSize; i++) {
      p1 = sha256(p1.digest());
  }

  p1 = p1.digest();
  let h1 = sha256(p1).digest('hex');
  if ('0x'+h1 === cert) {
      return '0x'+p1.toString('hex');
  }
  return undefined;
}

const signTransactionAndProof = (tx: any, proof: string) => {

  if (proof) {
    proof = proof.substring(2);
  }
  let { to, value, data }: any = tx;
  data = data.substring(2);
  let valueHex = value.toHexString().substring(2);
  let vhl = valueHex.length;
  for (let i = 0; i < 64-vhl; i++) {
    valueHex = '0'+valueHex;
  }
  let txCert = ethers.utils.sha256(to+valueHex+data+proof);
  return { txCert };
}
const PASSWORD = '123123';

describe("No-Wallet Account", async () => {

  const deployOneMinuteDelayVault = async () => {

    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
    const wallet = await TwoFactorWallet.deploy();
    let { cert, nonceSize } = passwordAndAddressToCertAndNonce(PASSWORD, wallet.address);
    const ManualRGFProvider = await ethers.getContractFactory(RGF_MANUAL_CONTRACT_NAME);
    const RGFProvider = await ManualRGFProvider.deploy(wallet.address, RGF, RGFM, MIN_RGF);

    await wallet.init(cert, nonceSize, RGFProvider.address);
    await wallet.topup({ value: ethers.utils.parseEther("10.") });
    return { wallet, cert, nonceSize };
  };

  const deployRGFMProvider = (owner: any) => {

    return async () => {
      const [owner, addr1, addr2, addr3] = await ethers.getSigners();
      const ManualRGFProvider = await ethers.getContractFactory(RGF_MANUAL_CONTRACT_NAME);
      const RGFProvider = await ManualRGFProvider.deploy(owner.address, RGF, RGFM, MIN_RGF);
      return { RGFProvider };  
    };
  };

  it("Deploy with passwords", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    let { wallet, cert, nonceSize } = await loadFixture(deployOneMinuteDelayVault);

    let to = addr1.address;
    let value = ethers.utils.parseEther("8.");
    let data = '';

    let proof = passwordsAndAddressAndCertAndNonceToProof(PASSWORD, wallet.address, cert, await wallet.nonce(), nonceSize);
    let {txCert} = signTransactionAndProof({ to, data, value }, proof||'');

    const gweiValue = MIN_RGF;
    await wallet.call(addr1.address, value, [], txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
    await wallet.expose(proof, 0);

    console.log({ balance: ethers.utils.formatEther(await owner.getBalance()) })
    console.log({ balance: ethers.utils.formatEther(await addr1.getBalance()) })
    console.log({ balance: ethers.utils.formatEther(await wallet.provider.getBalance(wallet.address)) })
  });


  it("First is the taker", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    let { wallet, cert, nonceSize } = await loadFixture(deployOneMinuteDelayVault);

    let to = addr1.address;
    let value = ethers.utils.parseEther("9.");
    let data = '';

    let proof = passwordsAndAddressAndCertAndNonceToProof(PASSWORD, wallet.address, cert, await wallet.nonce(), nonceSize);
    let {txCert} = signTransactionAndProof({ to, data, value }, proof||'');

    const gweiValue = MIN_RGF;
    await wallet.call(addr1.address, value, [], txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });

    value = ethers.utils.parseEther("1.");
    let {txCert: txCert2} = signTransactionAndProof({ to, data, value }, proof||'');
    await wallet.call(addr1.address, value, [], txCert2, { value: gweiValue.mul(BigNumber.from(RGFM)) });

    await wallet.expose(proof, 0);
    console.log({ balance: ethers.utils.formatEther(await addr1.getBalance()) })
  });

  it("Wallet-less", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    let { wallet, cert, nonceSize } = await loadFixture(deployOneMinuteDelayVault);

    let to = addr1.address;
    let value = ethers.utils.parseEther("0.000000000000000001");
    let data = '';
    const gweiValue = MIN_RGF;

    let proof = passwordsAndAddressAndCertAndNonceToProof(PASSWORD, wallet.address, cert, await wallet.nonce(), nonceSize);
    let {txCert} = signTransactionAndProof({ to, data, value }, proof||'');

    await wallet.connect(addr2).call(addr1.address, value, [], txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
    await wallet.connect(addr3).expose(proof, 0);
    console.log({ balance: ethers.utils.formatEther(await addr1.getBalance()) });
  });

  it("Reset passwords", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    let { wallet, cert, nonceSize } = await loadFixture(deployOneMinuteDelayVault);

    const NEW_PASSWORD = '111';
    let { cert: certNew, nonceSize: nonceSizeNew } = passwordAndAddressToCertAndNonce(NEW_PASSWORD, wallet.address);

    const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
    const iface = TwoFactorWallet.interface;

    let data = iface.encodeFunctionData("resetPassword", [
      certNew,
      nonceSizeNew
    ]);

    let to = wallet.address;
    let value = ethers.utils.parseEther("0.");
    let proof = passwordsAndAddressAndCertAndNonceToProof(PASSWORD, wallet.address, cert, await wallet.nonce(), nonceSize);
    let {txCert} = signTransactionAndProof({ to, data, value }, proof||'');

    const gweiValue = MIN_RGF;
    await wallet.call(wallet.address, value, data, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
    await wallet.expose(proof, 0);

    to = addr1.address;
    value = ethers.utils.parseEther("1.");
    proof = passwordsAndAddressAndCertAndNonceToProof(NEW_PASSWORD, wallet.address, certNew, await wallet.nonce(), nonceSizeNew);
    data = '0x';
    let {txCert: txCertNew} = signTransactionAndProof({ to, data, value }, proof||'');
    await wallet.call(to, value, data, txCertNew, { value: gweiValue.mul(BigNumber.from(RGFM)) });
    await wallet.expose(proof, 0);
    console.log({ balance: ethers.utils.formatEther(await addr1.getBalance()) });
  });


  it("Change gas parameters", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    let { wallet, cert, nonceSize } = await loadFixture(deployOneMinuteDelayVault);
    const ManualRGFProvider = await ethers.getContractFactory(RGF_MANUAL_CONTRACT_NAME);
    const ifaceRGF = ManualRGFProvider.interface;
    let to = await wallet.rgfProvider();
    let value = ethers.utils.parseEther('0.0');
    let data = ifaceRGF.encodeFunctionData("set", [ 1, 1, 1 ]);
    console.log(data);
    let proof = passwordsAndAddressAndCertAndNonceToProof(PASSWORD, wallet.address, cert, await wallet.nonce(), nonceSize);
    let {txCert} = signTransactionAndProof({ to, data, value }, proof||'');
    const gweiValue = MIN_RGF;
    await wallet.call(to, value, data, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
    await wallet.expose(proof, 0);

    let rgfProvider = ManualRGFProvider.attach(to);

    console.log({
      RGF: ethers.utils.formatUnits(await rgfProvider.RGF(), 0),
      RGFM: ethers.utils.formatUnits(await rgfProvider.RGF(), 0),
      MIN_RGF: ethers.utils.formatUnits(await rgfProvider.MIN_RGF(), 0)
    })
  });


  it("Change RGF provider", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    let { wallet, cert, nonceSize } = await loadFixture(deployOneMinuteDelayVault);

    const ManualRGFProvider = await ethers.getContractFactory(RGF_MANUAL_CONTRACT_NAME);
    const rgfProvider = await ManualRGFProvider.deploy(wallet.address, 2, 2, 2);

    const TwoFactorWallet = await ethers.getContractFactory(CONTRACT_NAME);
    const iface = TwoFactorWallet.interface;

    console.log({
      provider: await wallet.rgfProvider(),
    });

    let to = wallet.address;
    let value = ethers.utils.parseEther('0.0');
    let data = iface.encodeFunctionData("setRGFProvider", [ rgfProvider.address ]);
    let proof = passwordsAndAddressAndCertAndNonceToProof(PASSWORD, wallet.address, cert, await wallet.nonce(), nonceSize);
    let {txCert} = signTransactionAndProof({ to, data, value }, proof||'');
    const gweiValue = MIN_RGF;
    await wallet.call(to, value, data, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });
    await wallet.expose(proof, 0);

    console.log({
      provider: await wallet.rgfProvider(),
    });
  });

  it("Cost tests", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    let { wallet, cert, nonceSize } = await loadFixture(deployOneMinuteDelayVault);

    console.log({
      provider: await wallet.rgfProvider(),
    });

    let to = wallet.address;
    let value = ethers.utils.parseEther('0.0');
    let proof = passwordsAndAddressAndCertAndNonceToProof(PASSWORD, wallet.address, cert, await wallet.nonce(), nonceSize);

    let data = '0x';
    const LENGTH = 200;
    for (let i = 0; i < LENGTH; i++) {
      data += '000000';
      let txCert = '0xffe7086e8f6783c5cd30d1c45919ae2484149c5c0a91bce0e429208172194745';
      const gweiValue = MIN_RGF;
      await wallet.call(to, value, data, txCert, { value: gweiValue.mul(BigNumber.from(RGFM)) });  
    }
    await wallet.expose(proof, 0);
    await wallet.exposeCont();

    console.log({
      provider: await wallet.rgfProvider(),
    });
  });
});


