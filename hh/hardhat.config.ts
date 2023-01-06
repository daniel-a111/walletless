import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  // defaultNetwork: "polygon",
  // defaultNetwork: "aws",
  defaultNetwork: "localhost",
  networks: {
    hardhat: {
      gas: 6000000
    },
    localhost: {
      chainId: 14333,
      // url: "http://127.0.0.1:8545"
      url: "http://127.0.0.1:8545",
      accounts: ['277a1ca06da6f342b7ad641281805347d5eec205141ff77c438a64e1525b71e0']

    },
    aws: {
      chainId: 31337,
      url: "http://100.24.205.203:8545"
    },
    polygon: {
      chainId: 137,
      url: "https://polygon-mainnet.g.alchemy.com/v2/UfvWQbLFTEBndoHds9JnDgwzUpepU1Z5",
      accounts: ['dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97']
    }
  },
  // paths: {
  //   sources: "./contracts",
  //   tests: "./test",
  //   cache: "./cache",
  //   artifacts: "./artifacts"
  // },
};

export default config;
