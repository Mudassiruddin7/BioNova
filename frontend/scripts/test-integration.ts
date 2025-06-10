import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import path from "path";

async function main() {
  console.log("Starting integration test for HackHazards dApp...");

  // Deploy contracts for testing
  console.log("Deploying contracts to hardhat network...");
  
  // Deploy SampleProvenance
  const SampleProvenance = await ethers.getContractFactory("SampleProvenance");
  const sampleProvenance = await SampleProvenance.deploy();
  await sampleProvenance.waitForDeployment();
  
  // Deploy ExperimentalDataAudit
  const ExperimentalDataAudit = await ethers.getContractFactory("ExperimentalDataAudit");
  const experimentalDataAudit = await ExperimentalDataAudit.deploy();
  await experimentalDataAudit.waitForDeployment();
  
  // Deploy AccessControl
  const AccessControl = await ethers.getContractFactory("AccessControl");
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  
  // Deploy WorkflowAutomation
  const WorkflowAutomation = await ethers.getContractFactory("WorkflowAutomation");
  const workflowAutomation = await WorkflowAutomation.deploy();
  await workflowAutomation.waitForDeployment();
  
  // Deploy IntellectualProperty
  const IntellectualProperty = await ethers.getContractFactory("IntellectualProperty");
  const intellectualProperty = await IntellectualProperty.deploy();
  await intellectualProperty.waitForDeployment();

  console.log("All contracts deployed successfully!");
  
  // Get contract addresses
  const addresses = {
    sampleProvenance: await sampleProvenance.getAddress(),
    experimentalDataAudit: await experimentalDataAudit.getAddress(),
    accessControl: await accessControl.getAddress(),
    workflowAutomation: await workflowAutomation.getAddress(),
    intellectualProperty: await intellectualProperty.getAddress(),
  };
  
  console.log("Contract addresses:", addresses);
  
  // Write addresses to a file for the frontend
  const contractsDir = path.join(__dirname, "../src/contracts");
  const filePath = path.join(contractsDir, "contract-addresses.json");
  
  try {
    writeFileSync(
      filePath,
      JSON.stringify(addresses, null, 2)
    );
    console.log(`Contract addresses written to ${filePath}`);
  } catch (error) {
    console.error("Error writing contract addresses:", error);
  }
  
  // Test a sample interaction with SampleProvenance
  console.log("Testing contract interaction...");
  try {
    // Create a sample registration
    const sampleId = "SAMPLE-001";
    const sampleType = "Chemical";
    const description = "Hydrogen peroxide 30%";
    const hazardLevel = "high";
    
    const tx = await sampleProvenance.registerSample(
      sampleId,
      sampleType,
      description,
      hazardLevel
    );
    
    await tx.wait();
    console.log(`Sample registered with ID: ${sampleId}`);
    
    // Verify the sample was registered correctly
    const sample = await sampleProvenance.getSample(sampleId);
    console.log("Retrieved sample:", sample);
    
    if (sample.sampleType === sampleType) {
      console.log("✅ Integration test successful!");
    } else {
      console.log("❌ Integration test failed!");
    }
  } catch (error) {
    console.error("Error during contract interaction:", error);
    console.log("❌ Integration test failed!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 