import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  // defaultNetwork: "localhost",
  networks: {
    hardhat: {
      gas: 6000000
    },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545"
    },
    aws: {
      chainId: 31337,
      url: "http://100.24.205.203:8545"
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
