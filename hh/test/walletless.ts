import { ethers } from "hardhat";
import {BigNumber} from 'ethers';
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { CONTRACT_NAME, DEPOLYER_CONTRACT_NAME } from "../src/constants";
import {crypto} from '../src/walletless';
const { getContractAddress } = require('@ethersproject/address')
import { expect } from "chai";
import ethWallet from'ethereumjs-wallet';
import { sha256 } from "../src/utils";

const PASSWORD = '123123';

describe("Walletless", async () => {

  const deployDeployer = async () => {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const WalletlessDeployer = await ethers.getContractFactory('WalletlessDeployer');
    const deployer = await WalletlessDeployer.deploy();
    return {deployer};
  };

  const deployReverter = async () => {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const Reverter = await ethers.getContractFactory('Reverter');
    const reverter = await Reverter.deploy();
    return {reverter};
  };

  const deployWalletless = async () => {
    const [owner, addr1, addr2, {provider}] = await ethers.getSigners();
    const WalletlessDeployer = await ethers.getContractFactory(DEPOLYER_CONTRACT_NAME);
    const Walletless = await ethers.getContractFactory(CONTRACT_NAME);

    {
      const nonce = await ethers.provider.getTransactionCount(owner.address);
      const from = owner.address;
      const nextOwnerAddress = getContractAddress({from, nonce});
      console.log({nextOwnerAddress})
    }
    const walletlessDeployer = await WalletlessDeployer.deploy();
    const from = walletlessDeployer.address;
    const nonce = await ethers.provider.getTransactionCount(walletlessDeployer.address);
    const address = getContractAddress({from, nonce});
    console.log({
      from, nonce
    });
    let difficulty = 100;
    let chain: crypto.types.PreImageAccess = crypto.preImageChain(`${address}${PASSWORD}`, difficulty);
    console.log({address})
    const tx = await walletlessDeployer.connect(owner).createAccountAndInit(address, chain, { gasLimit: 10_000_000 });
    const receipt = await provider?.getTransactionReceipt(tx.hash);

    if (receipt?.status === 1) {
      const wallet = Walletless.attach(address);
      return { wallet, chain, difficulty };
    }
  };

  it("State test", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    let { wallet, chain, difficulty }: any = await loadFixture(deployWalletless);
    let seed = `${wallet.address}${PASSWORD}`;
    let auth = crypto.authPreImageChain(seed, chain, difficulty+100);
    let {proof, proofProof}: any = crypto.preImageAccess(wallet.address, PASSWORD, chain, difficulty+100);

    await addr1.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("1.0")
    });

    expect(await owner.provider?.getBalance(wallet.address)).to.equal(ethers.utils.parseEther("1.0"));

    const payed = ethers.Wallet.createRandom()

    let to = payed.address;
    let value = ethers.utils.parseEther("0.5");
    let data = '0x';
    let txCert = crypto.presetCert(to, value, data, proof);

    console.log(await wallet.get);
    await wallet.preset(to, value, data, txCert, { value: ethers.utils.parseEther("0.001") });
    let state = await wallet.getState();


    const ManualRGFProvider = await ethers.getContractFactory('ManualRGFProvider');
    let rgfProvider = ManualRGFProvider.attach(state.rgfProvider);
    console.log('RGF:');
    console.log(ethers.utils.formatEther(await rgfProvider.get(data.length-2, 0)));
    


    let nextNonce = state.cert;
    expect(state.presetCursor).to.eq(BigNumber.from(1));
    expect(state.pending.length).to.eq(1);
    let pending = state.pending[0];
    console.log({txCert})

    expect(pending.to).to.eq(to);
    expect(pending.value).to.eq(value);
    expect(pending.data).to.eq(data);
    expect(pending.cert).to.eq(txCert);
    expect(await wallet.verifyRecord(0, proof)).to.eq(true);

    let e = expect(wallet.expose(proof, 0, { gasLimit: 1_000_000 }));

    e.to.emit(wallet, "TxDone")
    .withArgs(nextNonce, to, value, data);

    // e.to.emit(wallet, "SubmitTransaction")
    // .withArgs(0, 0, to, value, data)

    // e.to.emit(wallet, "TransactionSCAA")
    // .withArgs(true)

    await e;
    
    state = await wallet.getState();
    expect((await wallet.getState()).cert).to.eq(proof);
    expect(await owner.provider?.getBalance(payed.address)).to.equal(ethers.utils.parseEther("0.5"));
    expect(await owner.provider?.getBalance(wallet.address)).to.equal(ethers.utils.parseEther("0.5"));
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////

  });


  it("Reverted", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    let { wallet, chain, difficulty }: any = await loadFixture(deployWalletless);

    let state = await wallet.getState();
    let nextNonce = state.cert;

    let seed = `${wallet.address}${PASSWORD}`;
    let auth = crypto.authPreImageChain(seed, chain, difficulty+100);
    let {proof, proofProof}: any = crypto.preImageAccess(wallet.address, PASSWORD, chain, difficulty+100);

    await addr1.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("1.0")
    });

    expect(await owner.provider?.getBalance(wallet.address)).to.equal(ethers.utils.parseEther("1.0"));

    const payed = ethers.Wallet.createRandom()

    let to = payed.address;
    let value = ethers.utils.parseEther("2.5");
    let data = '0x';
    let txCert = crypto.presetCert(to, value, data, proof);
    await wallet.preset(to, value, data, txCert, { value: ethers.utils.parseEther("0.001") });
    state = await wallet.getState();

    expect(state.presetCursor).to.eq(BigNumber.from(1));
    expect(state.pending.length).to.eq(1);
    let pending = state.pending[0];

    expect(pending.to).to.eq(to);
    expect(pending.value).to.eq(value);
    expect(pending.data).to.eq(data);
    expect(pending.cert).to.eq(txCert);

    expect(await wallet.verifyRecord(0, proof)).to.eq(true);

    let e = expect(wallet.expose(proof, 0, { gasLimit: 1_000_000 }));

    e.to.emit(wallet, "TxReverted")
    .withArgs(nextNonce, to, value, data, "Transaction reverted silently");

    // e.to.emit(wallet, "SubmitTransaction")
    // .withArgs(0, 0, to, value, data)

    // e.to.emit(wallet, "TransactionSCAA")
    // .withArgs(true)

    await e;
    
    // state = await wallet.getState();
    // expect((await wallet.getState()).nonce).to.eq(1);
    // expect(await owner.provider?.getBalance(payed.address)).to.equal(ethers.utils.parseEther("0.5"));
    // expect(await owner.provider?.getBalance(wallet.address)).to.equal(ethers.utils.parseEther("0.501"));


    
    // state = await wallet.getState();
    // console.log({state})
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////

  });




  it("Reverterd Custom", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    let { wallet, chain, difficulty }: any = await loadFixture(deployWalletless);
    let { reverter }: any = await loadFixture(deployReverter);


    await expect(reverter.ok()).to.be.reverted;
    let seed = `${wallet.address}${PASSWORD}`;
    let auth = crypto.authPreImageChain(seed, chain, difficulty+100);
    let {proof, proofProof}: any = crypto.preImageAccess(wallet.address, PASSWORD, chain, difficulty+100);

    await addr1.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("1.0")
    });

    expect(await owner.provider?.getBalance(wallet.address)).to.equal(ethers.utils.parseEther("1.0"));

    // const payed = ethers.Wallet.createRandom()

    // let to = reverter.address;
    let value = ethers.utils.parseEther("0.0");
    // console.log(await reverter.populateTransaction.ok());
    let {to, data} = await reverter.populateTransaction.ok()
    // let data = '0x';
    console.log({to, data, value})
    await expect(reverter.ok()).to.be.not;
    let txCert = crypto.presetCert(to, value, data, proof);
    await wallet.preset(to, value, data, txCert, { value: ethers.utils.parseEther("0.00102") });
    let state = await wallet.getState();

    expect(state.presetCursor).to.eq(BigNumber.from(1));
    expect(state.pending.length).to.eq(1);
    let pending = state.pending[0];

    expect(pending.to).to.eq(to);
    expect(pending.value).to.eq(value);
    expect(pending.data).to.eq(data);
    expect(pending.cert).to.eq(txCert);

    expect(await wallet.verifyRecord(0, proof)).to.eq(true);

    await expect(wallet.exposeCont()).to.be.reverted;

    // await wallet.expose(proof, 0);
    let e = expect(wallet.expose(proof, 0, { gasLimit: 1_000_000 }));
    e.to.emit(wallet, 'TxReverted');
    await e;
    // await wallet.expose(proof, 0);

    // e.to.emit(wallet, "TxDone")
    // .withArgs(0, 0, to, value, data);

    // e.to.emit(wallet, "TxReverted")
    // .withArgs(0, 0, to, value, data, "Transaction reverted silently");

    // e.to.emit(wallet, "SubmitTransaction")
    // .withArgs(0, 0, to, value, data)

    // e.to.emit(wallet, "TransactionSCAA")
    // .withArgs(true)

    // await e;
    // 
    state = await wallet.getState();
    console.log({state})

    // await expect(wallet.exposeCont()).to.be.not.reverted;
    // expect((await wallet.getState()).nonce).to.eq(1);
    // expect(await owner.provider?.getBalance(payed.address)).to.equal(ethers.utils.parseEther("0.5"));
    // expect(await owner.provider?.getBalance(wallet.address)).to.equal(ethers.utils.parseEther("0.501"));



    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////

  });





  it("Reverted", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    let { wallet, chain, difficulty }: any = await loadFixture(deployWalletless);

    let state = await wallet.getState();
    let nextNonce = state.cert;

    let seed = `${wallet.address}${PASSWORD}`;
    let auth = crypto.authPreImageChain(seed, chain, difficulty+100);
    let {proof, proofProof}: any = crypto.preImageAccess(wallet.address, PASSWORD, chain, difficulty+100);

    await addr1.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("1.0")
    });

    expect(await owner.provider?.getBalance(wallet.address)).to.equal(ethers.utils.parseEther("1.0"));

    const payed = ethers.Wallet.createRandom()

    let to = payed.address;
    let value = ethers.utils.parseEther("2.5");
    let data = '0x';
    let txCert = crypto.presetCert(to, value, data, proof);
    await wallet.preset(to, value, data, txCert, { value: ethers.utils.parseEther("0.001") });
    state = await wallet.getState();

    expect(state.presetCursor).to.eq(BigNumber.from(1));
    expect(state.pending.length).to.eq(1);
    let pending = state.pending[0];

    expect(pending.to).to.eq(to);
    expect(pending.value).to.eq(value);
    expect(pending.data).to.eq(data);
    expect(pending.cert).to.eq(txCert);

    expect(await wallet.verifyRecord(0, proof)).to.eq(true);

    let e = expect(wallet.expose(proof, 0, { gasLimit: 1_000_000 }));

    e.to.emit(wallet, "TxReverted")
    .withArgs(nextNonce, to, value, data, "Transaction reverted silently");

    // e.to.emit(wallet, "SubmitTransaction")
    // .withArgs(0, 0, to, value, data)

    // e.to.emit(wallet, "TransactionSCAA")
    // .withArgs(true)

    await e;
    
    // state = await wallet.getState();
    // expect((await wallet.getState()).nonce).to.eq(1);
    // expect(await owner.provider?.getBalance(payed.address)).to.equal(ethers.utils.parseEther("0.5"));
    // expect(await owner.provider?.getBalance(wallet.address)).to.equal(ethers.utils.parseEther("0.501"));


    
    // state = await wallet.getState();
    // console.log({state})
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////

  });




  it("Multi deploy", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    let { deployer }: any = await loadFixture(deployDeployer);

    let addresses: string[] = [];
    let creates: any[] = [];
    for (let i = 0; i < 10; i++) {

      let account = getContractAddress({from: deployer.address, nonce: i+1 });
      console.log(account);

      let addressData = ethWallet.generate();
      let address = ethers.utils.getAddress(addressData.getAddressString());
      let PK = addressData.getPrivateKeyString();
      console.log({address, PK});
      creates.push({
        account, initializer: address, PK
      });
      addresses.push(address);
    }

    // let tx = deployer.deployFor([addresses]);
    let tx = deployer.deployFor(addresses);
    let e = expect(tx);
    for (let create of creates) {
      console.log(create)
      e.emit(deployer, 'ScaaCreated').withArgs(create.account, create.initializer);
    }
    await e;

    for (let create of creates) {
      let addr = new ethers.Wallet(create.PK, ethers.provider); // TODO wrap in function
      owner.sendTransaction({to: addr.address, value: ethers.utils.parseEther("0.3")});
      await deployer.connect(addr).initAccount(create.account, ethers.utils.sha256('0xabca'));
    }
  });

});



// function expect(arg0: any) {
//   throw new Error("Function not implemented.");
// }

