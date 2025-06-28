const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying LearnTwinChain contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Get balance (compatible with both ethers v5 and v6)
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther ? ethers.formatEther(balance) : ethers.utils.formatEther(balance), "ETH");

  // Deploy ModuleProgressNFT (ERC-1155)
  console.log("\n📦 Deploying ModuleProgressNFT...");
  const ModuleProgressNFT = await ethers.getContractFactory("ModuleProgressNFT");
  const moduleProgressNFT = await ModuleProgressNFT.deploy();
  await moduleProgressNFT.waitForDeployment ? moduleProgressNFT.waitForDeployment() : moduleProgressNFT.deployed();
  const moduleProgressAddress = moduleProgressNFT.target || moduleProgressNFT.address;
  console.log("✅ ModuleProgressNFT deployed to:", moduleProgressAddress);

  // Deploy LearningAchievementNFT (ERC-721)
  console.log("\n🏆 Deploying LearningAchievementNFT...");
  const LearningAchievementNFT = await ethers.getContractFactory("LearningAchievementNFT");
  const learningAchievementNFT = await LearningAchievementNFT.deploy();
  await learningAchievementNFT.waitForDeployment ? learningAchievementNFT.waitForDeployment() : learningAchievementNFT.deployed();
  const achievementAddress = learningAchievementNFT.target || learningAchievementNFT.address;
  console.log("✅ LearningAchievementNFT deployed to:", achievementAddress);

  // Deploy DigitalTwinRegistry
  console.log("\n📋 Deploying DigitalTwinRegistry...");
  const DigitalTwinRegistry = await ethers.getContractFactory("DigitalTwinRegistry");
  const digitalTwinRegistry = await DigitalTwinRegistry.deploy();
  await digitalTwinRegistry.waitForDeployment ? digitalTwinRegistry.waitForDeployment() : digitalTwinRegistry.deployed();
  const registryAddress = digitalTwinRegistry.target || digitalTwinRegistry.address;
  console.log("✅ DigitalTwinRegistry deployed to:", registryAddress);

  // Save deployment addresses
  const network = await ethers.provider.getNetwork();
  const deploymentData = {
    network: Number(network.chainId), // Convert BigInt to Number
    deployer: deployer.address,
    contracts: {
      MODULE_PROGRESS_CONTRACT_ADDRESS: moduleProgressAddress,
      ACHIEVEMENT_CONTRACT_ADDRESS: achievementAddress,
      REGISTRY_CONTRACT_ADDRESS: registryAddress
    },
    timestamp: Math.floor(Date.now() / 1000)
  };

  const fs = require('fs');
  fs.writeFileSync('deployment_addresses.json', JSON.stringify(deploymentData, null, 2));
  console.log("\n📝 Deployment addresses saved to: deployment_addresses.json");

  // Generate .env template
  let envTemplate = "# Blockchain Contract Addresses\n";
  for (const [key, address] of Object.entries(deploymentData.contracts)) {
    envTemplate += `${key}=${address}\n`;
  }
  fs.writeFileSync('deployment.env', envTemplate);
  console.log("📝 Environment template saved to: deployment.env");

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\n📋 Deployment Summary:");
  for (const [contractName, address] of Object.entries(deploymentData.contracts)) {
    console.log(`  ${contractName}: ${address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });