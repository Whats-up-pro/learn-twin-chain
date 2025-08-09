require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },
    sepolia: {
      url: process.env.BLOCKCHAIN_RPC_URL || "https://sepolia.infura.io/v3/31c6f41e16fe4968a5ecfd07c2aedb9f",
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY ? [process.env.BLOCKCHAIN_PRIVATE_KEY] : [],
      chainId: 11155111
    }
  },
  paths: {
    sources: "../contracts",
    tests: "../test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
