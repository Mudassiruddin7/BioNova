const { createPublicClient, createWalletClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Contract configuration
const CONTRACTS = [
  'SampleProvenance',
  'ExperimentalDataAudit',
  'AccessControl',
  'WorkflowAutomation',
  'IntellectualProperty'
];

// Environment configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

if (!PRIVATE_KEY) {
  throw new Error('Please set your PRIVATE_KEY in the environment variables');
}

// Initialize clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL)
});

const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(RPC_URL)
});

// Display account info
console.log(`Deploying contracts from account: ${account.address}`);

// Helper function to load artifact and ABI
function loadArtifact(contractName) {
  const artifactPath = path.join(__dirname, 'artifacts', `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact for ${contractName} not found. Make sure to compile the contracts first.`);
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
  const abi = require(`./abis/${contractName}.json`);
  
  return { artifact, abi, bytecode: `0x${artifact.bytecode}` };
}

// Contract deployment function
async function deployContract(contractName, args = []) {
  try {
    console.log(`Deploying ${contractName}...`);
    
    const { abi, bytecode } = loadArtifact(contractName);
    
    console.log(`Deploying ${contractName} to ${baseSepolia.name}...`);
    
    // Deploy the contract
    const hash = await walletClient.deployContract({
      abi,
      bytecode,
      args
    });

    console.log(`Deployment transaction hash: ${hash}`);
    console.log(`Waiting for transaction to be mined...`);
    
    // Wait for deployment transaction
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (!receipt.contractAddress) {
      throw new Error('Contract deployment failed');
    }

    console.log(`${contractName} deployed to: ${receipt.contractAddress}`);
    return receipt.contractAddress;
  } catch (error) {
    console.error(`Error deploying ${contractName}:`, error);
    throw error;
  }
}

// Main deployment function
async function deployAll() {
  try {
    console.log('Starting contract deployment to Base Sepolia...');
    
    const deployedAddresses = {};

    // Deploy all contracts
    for (const contractName of CONTRACTS) {
      try {
        deployedAddresses[toCamelCase(contractName)] = await deployContract(contractName);
      } catch (error) {
        console.error(`Failed to deploy ${contractName}:`, error);
        // Continue with next contract instead of stopping the whole deployment
      }
    }

    // Save deployed addresses to file
    fs.writeFileSync(
      path.join(__dirname, 'contract-addresses.json'),
      JSON.stringify(deployedAddresses, null, 2)
    );

    console.log('Deployment completed!');
    console.log('Deployed addresses saved to contract-addresses.json');
    
    // Print summary
    console.log('\nDeployment Summary:');
    Object.keys(deployedAddresses).forEach(contractName => {
      console.log(`${contractName}: ${deployedAddresses[contractName]}`);
    });
    
    return deployedAddresses;
  } catch (error) {
    console.error('Deployment failed:', error);
    throw error;
  }
}

// Helper function to convert contract name to camelCase
function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Run deployment if script is executed directly
if (require.main === module) {
  deployAll().catch(console.error);
}

// Export for programmatic usage
module.exports = { deployAll, deployContract }; 