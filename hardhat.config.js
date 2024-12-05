/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 1337
    }
  }
};
