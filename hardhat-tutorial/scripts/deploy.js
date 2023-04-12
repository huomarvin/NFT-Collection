const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");

async function main() {
  // 上一个模块中部署的白名单合约的地址
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
  // 从哪里可以提取Crypto Dev NFT的元数据的URL
  const metadataURL = METADATA_URL;
  /*
  一个合约工厂是一个抽象，用于部署新的智能合约，所以cryptoDevsContract是我们的CryptoDevs合约的实例工厂。
  */
  const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");

  // 部署合约
  const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
    metadataURL,
    whitelistContract
  );

  // 等待合约部署完成
  await deployedCryptoDevsContract.deployed();

  // 打印合约的地址
  console.log(
    "Crypto Devs Contract Address:",
    deployedCryptoDevsContract.address
  );
}

// 调用main函数并捕获错误
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });