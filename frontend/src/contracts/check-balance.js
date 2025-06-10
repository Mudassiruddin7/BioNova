const { createPublicClient, http, formatEther } = require('viem');
const { baseSepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');
require('dotenv').config();

async function checkBalance() {
  // Private key from .env file
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  
  if (!PRIVATE_KEY) {
    throw new Error('No private key found in .env file');
  }
  
  // Create client
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http('https://sepolia.base.org')
  });
  
  // Derive address from private key
  const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
  const address = account.address;
  
  console.log(`Checking balance for address: ${address}`);
  
  try {
    // Get balance
    const balance = await client.getBalance({ address });
    
    console.log(`Raw Balance: ${balance} wei`);
    console.log(`Formatted Balance: ${formatEther(balance)} ETH`);
    
    // Check if balance is sufficient
    if (balance < BigInt(1e16)) { // 0.01 ETH
      console.log('Warning: Balance is low. You might need more ETH to deploy contracts.');
    } else {
      console.log('Balance seems sufficient for contract deployment.');
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
  }
}

checkBalance(); 