// scripts/deploy.js
import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  // connect to network manually (v3 way)
  const provider = new ethers.JsonRpcProvider(
    process.env.INFURA_SEPOLIA_URL
  );

  const wallet = new ethers.Wallet(
    process.env.PRIVATE_KEY,
    provider
  );

  // load compiled artifact
  const artifact = await hre.artifacts.readArtifact("ResearchLog");

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  const contract = await factory.deploy();

  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});