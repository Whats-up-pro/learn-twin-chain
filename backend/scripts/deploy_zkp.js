const hre = require("hardhat");

async function main() {
  const ZKPCertificateRegistry = await hre.ethers.getContractFactory("ZKPCertificateRegistry");
  const zkpCertificate = await ZKPCertificateRegistry.deploy();
  console.log("ZKPCertificateRegistry deployed to:", zkpCertificate.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});