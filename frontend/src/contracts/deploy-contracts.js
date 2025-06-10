#!/usr/bin/env node
const { compileContracts } = require('./compile');
const { deployAll } = require('./deploy');
const fs = require('fs');
const path = require('path');

/**
 * Main function that orchestrates the deployment workflow
 */
async function deployContracts() {
  try {
    console.log('=== Starting Contract Deployment Workflow ===');
    
    // Step 1: Ensure environment variables are set
    const envFile = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envFile)) {
      throw new Error('Missing .env file. Please create it based on .env.example');
    }
    
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY environment variable is missing');
    }
    
    if (!process.env.BASE_SEPOLIA_RPC_URL) {
      console.warn('BASE_SEPOLIA_RPC_URL not set, using default public endpoint');
    }
    
    // Step 2: Compile contracts
    console.log('\n=== Compiling Smart Contracts ===');
    await compileContracts();
    
    // Step 3: Deploy contracts
    console.log('\n=== Deploying Smart Contracts ===');
    const deployedAddresses = await deployAll();
    
    // Step 4: Verify successful deployment
    const requiredContracts = [
      'sampleProvenance',
      'experimentalDataAudit',
      'accessControl',
      'workflowAutomation',
      'intellectualProperty'
    ];
    
    const missingContracts = requiredContracts.filter(
      contract => !deployedAddresses[contract]
    );
    
    if (missingContracts.length > 0) {
      console.warn(`Warning: The following contracts were not deployed: ${missingContracts.join(', ')}`);
    } else {
      console.log('\n✅ All contracts successfully deployed!');
    }
    
    // Step 5: Print summary and next steps
    console.log('\n=== Deployment Summary ===');
    console.log('Contract addresses have been saved to src/contracts/contract-addresses.json');
    console.log('These addresses will be automatically used by the frontend application.');
    console.log('\nNext steps:');
    console.log('1. Start your frontend application with "npm run dev"');
    console.log('2. Connect your wallet that has Base Sepolia ETH');
    console.log('3. Begin interacting with your deployed contracts');
    
    return deployedAddresses;
  } catch (error) {
    console.error('Deployment workflow failed:', error);
    process.exit(1);
  }
}

// Run the function if executed directly
if (require.main === module) {
  deployContracts();
}

module.exports = { deployContracts }; 