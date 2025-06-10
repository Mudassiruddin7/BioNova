import { createPublicClient, createWalletClient, http, custom } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { keccak256, stringToHex, parseEther, Hex, Address } from 'viem';
import { transactionAPI } from '@/lib/api';
import { useChainSightStore } from '@/lib/stores/chainSightStore';

// Import the contract ABIs for BioNova genomics platform
import SampleProvenanceABI from './abis/SampleProvenance.json';
import ExperimentalDataAuditABI from './abis/ExperimentalDataAudit.json';
import AccessControlABI from './abis/AccessControl.json';
import WorkflowAutomationABI from './abis/WorkflowAutomation.json';
import IntellectualPropertyABI from './abis/IntellectualProperty.json';

// Contract addresses configuration
interface ContractAddresses {
  sampleProvenance: string;
  experimentalDataAudit: string;
  accessControl: string;
  workflowAutomation: string;
  intellectualProperty: string;
}

// Default placeholder addresses
const defaultAddresses: ContractAddresses = {
  sampleProvenance: '0x0000000000000000000000000000000000000000',
  experimentalDataAudit: '0x0000000000000000000000000000000000000000',
  accessControl: '0x0000000000000000000000000000000000000000',
  workflowAutomation: '0x0000000000000000000000000000000000000000',
  intellectualProperty: '0x0000000000000000000000000000000000000000'
};

// Try to load contract addresses from JSON
let addresses: ContractAddresses = { ...defaultAddresses };
try {
  // Using dynamic import to avoid require() style imports
  import('./contract-addresses.json').then(module => {
    addresses = { ...defaultAddresses, ...module.default };
  }).catch(err => {
    console.warn('Could not load contract addresses, using placeholders');
  });
} catch (importError) {
  console.warn('Could not load contract addresses, using placeholders');
}

// The chain where contracts are deployed
const CONTRACT_CHAIN = baseSepolia; // Using Base Sepolia testnet for development/testing

// Contract ABI mapping
const contractABIs: Record<keyof ContractAddresses, unknown[]> = {
  sampleProvenance: SampleProvenanceABI,
  experimentalDataAudit: ExperimentalDataAuditABI,
  accessControl: AccessControlABI,
  workflowAutomation: WorkflowAutomationABI,
  intellectualProperty: IntellectualPropertyABI
};

// Transaction type mapping by contract name
const contractToTransactionType: Record<keyof ContractAddresses, 'sample' | 'experiment' | 'access' | 'workflow' | 'ip'> = {
  sampleProvenance: 'sample',
  experimentalDataAudit: 'experiment',
  accessControl: 'access',
  workflowAutomation: 'workflow',
  intellectualProperty: 'ip'
};

// Function to check if a function exists in the ABI
function doesFunctionExistInAbi(abi: unknown[], functionName: string): boolean {
  for (const item of abi) {
    if (
      typeof item === 'object' && 
      item !== null && 
      'type' in item && 
      'name' in item && 
      item.type === 'function' && 
      item.name === functionName
    ) {
      return true;
    }
  }
  return false;
}

// Get contract info (abi and address)
function getContract(contractName: keyof ContractAddresses) {
  return {
    abi: contractABIs[contractName],
    address: addresses[contractName]
  };
}

// Create a public client for reading from contracts
const publicClient = createPublicClient({
  chain: CONTRACT_CHAIN,
  transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org')
});

// Export publicClient for components to use
export { publicClient };

// Cache for wallet client to prevent reconnection requests
let cachedWalletClient: any = null;
let cachedAccount: string | null = null;

// Function to check if localStorage is available (for SSR compatibility)
const isLocalStorageAvailable = () => {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Check for persisted wallet state at module load time
if (isLocalStorageAvailable()) {
  try {
    const persistedState = localStorage.getItem('chain-sight-storage');
    if (persistedState) {
      const { state } = JSON.parse(persistedState);
      if (state.wallet?.isConnected && state.wallet?.address) {
        console.log('Found persisted wallet connection:', state.wallet.address);
        cachedAccount = state.wallet.address;
      }
    }
  } catch (error) {
    console.warn('Error loading persisted wallet state:', error);
  }
}

// Helper function to sync transaction with backend
async function syncTransactionWithBackend(
  txHash: string, 
  description: string, 
  contractName: keyof ContractAddresses, 
  walletAddress: string,
  entityId?: string,
  metadata?: Record<string, any>
) {
  try {
    // Convert contract name to transaction type
    const type = contractToTransactionType[contractName];
    
    // Create transaction object for UI state
    const transaction = {
      hash: txHash,
      description,
      type,
      timestamp: Date.now(),
      status: 'pending' as const,
      walletAddress,
      entityId,
      metadata
    };
    
    // Directly update the global store
    const chainSightStore = useChainSightStore.getState();
    
    // Add transaction to UI state (this ensures it shows up immediately)
    chainSightStore.addTransaction(transaction);
    
    // Create transaction record in the backend
    await transactionAPI.createTransaction({
      hash: txHash,
      description,
      type,
      timestamp: Date.now(),
      status: 'pending',
      walletAddress,
      contractAddress: addresses[contractName],
      entityId,
      metadata
    });
    
    console.log(`Transaction ${txHash} synced with backend (${type})`);
    
    // Wait for transaction receipt asynchronously
    const checkTransactionReceipt = async () => {
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: txHash as `0x${string}`,
          timeout: 60000, // 60 seconds timeout
        });
        
        if (receipt) {
          // Update transaction status based on receipt
          const status = receipt.status === 'success' ? 'confirmed' : 'failed';
          const blockData = {
            blockNumber: Number(receipt.blockNumber),
            gasUsed: Number(receipt.gasUsed)
          };
          
          // Update backend
          await transactionAPI.updateTransactionStatus(txHash, status, blockData);
          
          // Update UI state again
          chainSightStore.setTransactionStatus(txHash, status, blockData);
          
          // Sync with backend to ensure complete data
          await chainSightStore.syncWithBackend();
          
          console.log(`Transaction ${txHash} status updated to ${status}`);
        }
      } catch (waitError) {
        console.error(`Failed to get receipt for transaction ${txHash}:`, waitError);
        // Still try to update local state if we catch an error
        chainSightStore.setTransactionStatus(txHash, 'failed');
        
        // Try syncing with backend one more time
        try {
          await chainSightStore.syncWithBackend();
        } catch (syncError) {
          console.error('Failed to sync after transaction error:', syncError);
        }
      }
    };
    
    // Start checking for receipt
    checkTransactionReceipt();
    
  } catch (syncError) {
    console.error('Failed to sync transaction with backend:', syncError);
    // Don't throw - we don't want to break the transaction flow for the user
  }
}

// Helper to get wallet client and account
async function getWalletClient() {
  // If we already have a cached wallet client and account, return it
  if (cachedWalletClient && cachedAccount) {
    console.log('Using cached wallet client with account:', cachedAccount);
    return { walletClient: cachedWalletClient, account: cachedAccount };
  }

  // Check for browser environment
  if (typeof window === 'undefined') {
    throw new Error('Not in browser environment');
  }

  try {
    // Check for persisted wallet state first before attempting to connect
    let persistedWalletAddress = null;
    if (isLocalStorageAvailable()) {
      try {
        const persistedState = localStorage.getItem('chain-sight-storage');
        if (persistedState) {
          const { state } = JSON.parse(persistedState);
          if (state.wallet?.isConnected && state.wallet?.address) {
            persistedWalletAddress = state.wallet.address;
            console.log('Found persisted wallet connection for transaction:', persistedWalletAddress);
          }
        }
      } catch (error) {
        console.warn('Error checking persisted wallet state:', error);
      }
    }

    // Define ethereum property on window for TypeScript
    interface WindowWithEthereum extends Window {
      ethereum?: {
        isMetaMask?: boolean;
        isCoinbaseWallet?: boolean;
        request: (args: Record<string, unknown>) => Promise<unknown>;
        chainId?: string;
      };
    }
    
    const windowWithEthereum = window as WindowWithEthereum;
    
    if (windowWithEthereum.ethereum) {
      // Check and switch chain if needed
      try {
        // Get the current chain ID from the wallet
        const currentChainIdHex = await windowWithEthereum.ethereum.request({ 
          method: 'eth_chainId' 
        });
        const currentChainId = parseInt(currentChainIdHex as string, 16);
        console.log(`Current wallet chain: ${currentChainId}, Target chain: ${CONTRACT_CHAIN.id}`);
        
        // If the current chain doesn't match our target chain, try to switch
        if (currentChainId !== CONTRACT_CHAIN.id) {
          console.log(`Switching chain from ${currentChainId} to ${CONTRACT_CHAIN.id} (${CONTRACT_CHAIN.name})`);
          
          try {
            // Request the wallet to switch to our chain
            await windowWithEthereum.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${CONTRACT_CHAIN.id.toString(16)}` }],
            });
            console.log(`Successfully switched to ${CONTRACT_CHAIN.name}`);
          } catch (switchError: unknown) {
            console.error('Error switching chain:', switchError);
            
            // Check if it's the expected error type
            const error = switchError as { code?: number; message?: string };
            
            // If the chain hasn't been added to the wallet yet
            if (error.code === 4902) {
              try {
                await windowWithEthereum.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: `0x${CONTRACT_CHAIN.id.toString(16)}`,
                      chainName: CONTRACT_CHAIN.name,
                      nativeCurrency: {
                        name: 'Ether',
                        symbol: 'ETH',
                        decimals: 18,
                      },
                      rpcUrls: ['https://sepolia.base.org'],
                      blockExplorerUrls: ['https://sepolia.basescan.org'],
                    },
                  ],
                });
              } catch (addError) {
                console.error('Error adding chain to wallet:', addError);
                throw new Error(`Please add the ${CONTRACT_CHAIN.name} network to your wallet manually. Chain ID: ${CONTRACT_CHAIN.id}`);
              }
            } else if (error.code === 4001) {
              throw new Error(`Please approve switching to the ${CONTRACT_CHAIN.name} network in your wallet to proceed.`);
            } else {
              throw new Error(`Unable to switch to ${CONTRACT_CHAIN.name} network. Please switch networks manually in your wallet.`);
            }
          }
        }
      } catch (chainError) {
        console.error('Error checking/switching chain:', chainError);
        throw chainError;
      }
      
      // Now create the wallet client with the correct chain
      const walletClient = createWalletClient({
        chain: CONTRACT_CHAIN,
        transport: custom(windowWithEthereum.ethereum)
      });
      
      try {
        // Get the account after ensuring correct chain
        const [account] = await walletClient.getAddresses();
    
        if (!account) {
          throw new Error('No wallet account connected. Please connect your wallet in the browser extension and try again.');
        }
        
        // Cache the wallet client and account for future use
        cachedWalletClient = walletClient;
        cachedAccount = account;
        
        console.log('Wallet client cached with account:', account);
        return { walletClient, account };
      } catch (accountError) {
        console.error('Error accessing wallet accounts:', accountError);
        throw new Error('Could not access your wallet accounts. Please ensure your wallet is unlocked and this site has permission to access your accounts.');
      }
    } else {
      // No wallet found
      let errorMessage = 'No wallet provider found. ';
      
      // Detect if we're on mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        errorMessage += 'Please use a mobile crypto wallet browser like MetaMask Mobile or Coinbase Wallet.';
      } else {
        errorMessage += 'Please install MetaMask or Coinbase Wallet browser extension and refresh the page.';
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Error getting wallet client:', error);
    // Re-throw with a more user-friendly message if it's not already a custom error
    if (error instanceof Error && 
        !error.message.includes('Please install MetaMask') && 
        !error.message.includes('No wallet account connected')) {
      throw new Error('Could not connect to wallet. Please check your wallet connection and try again.');
    }
    
    // Clear the cache if there was an error
    cachedWalletClient = null;
    cachedAccount = null;
    
    throw error;
  }
}

// Add a function to clear the wallet client cache when disconnecting
export function clearWalletClientCache() {
  console.log('Clearing wallet client cache');
  cachedWalletClient = null;
  cachedAccount = null;
}

// Generic read function
async function readContract<T>(
  contractName: keyof ContractAddresses,
  functionName: string,
  args: unknown[] = []
): Promise<T> {
  try {
    if (!publicClient) {
      throw new Error('Public client not available');
    }
    
    const { abi, address } = getContract(contractName);
    
    // Add verification that the function exists in the ABI
    const functionExists = doesFunctionExistInAbi(abi, functionName);
    
    if (!functionExists) {
      console.error(`Function "${functionName}" not found in ${contractName} ABI`);
      throw new Error(`Function "${functionName}" not found in contract ABI. Check your contract deployment and ABI definition.`);
    }
    
    if (address === defaultAddresses[contractName]) {
      console.warn(`Using placeholder address for ${contractName}. Make sure the contract is properly deployed.`);
    }
    
    console.log(`Reading from ${contractName}.${functionName} with args:`, args);
    const data = await publicClient.readContract({
      address: address as `0x${string}`,
      abi,
      functionName,
      args,
    }) as T;
    
    return data;
  } catch (error) {
    console.error(`Error reading from ${contractName}.${functionName}:`, error);
    
    // Enhanced error reporting
    if (error instanceof Error) {
      if (error.message.includes('could not be found')) {
        throw new Error(`Contract function "${functionName}" not found. Please check the ABI and contract deployment.`);
      } else if (error.message.includes('invalid address')) {
        throw new Error(`Invalid contract address for ${contractName}. Please verify the contract deployment.`);
      }
    }
    
    throw error;
  }
}

// Generic write function
async function writeContract(
  contractName: keyof ContractAddresses,
  functionName: string,
  args: unknown[] = [],
  transactionDetails?: {
    description: string;
    entityId?: string;
    metadata?: Record<string, any>;
  }
): Promise<string> {
  try {
    const { walletClient, account } = await getWalletClient();

    if (!account) {
      throw new Error("No wallet account available");
    }

    const contract = getContract(contractName);
    
    // Check if the function exists in the ABI
    if (!doesFunctionExistInAbi(contract.abi, functionName)) {
      throw new Error(`Function '${functionName}' not found in ${contractName} ABI`);
    }
    
    // Request approval and wait for transaction hash
    const hash = await walletClient.writeContract({
      address: contract.address as Address,
      abi: contract.abi,
      functionName,
      args,
      account: account as Address
    }) as string;
    
    // If transaction details are provided, sync with backend
    if (transactionDetails && account) {
      syncTransactionWithBackend(
        hash,
        transactionDetails.description,
        contractName,
        account,
        transactionDetails.entityId,
        transactionDetails.metadata
      );
    }
    
    return hash;
  } catch (error) {
    console.error(`Error writing to ${contractName}.${functionName}:`, error);
    throw error;
  }
}

// Specific contract functions using the generic helpers

// SampleProvenance functions - for genetic samples

/**
 * Register a new genetic sample in the blockchain
 */
export async function registerGenomeSample(
  sampleId: string,
  sampleType: string,
  description: string,
  importance: string
): Promise<string> {
  return writeContract('sampleProvenance', 'registerSample', [
    sampleId,
    sampleType,
    description,
    importance
  ], {
    description: `Registered Sample: ${sampleId}`,
    entityId: sampleId,
    metadata: {
      sampleType,
      importance
    }
  });
}

// Alias for registerGenomeSample to maintain backward compatibility
export const registerSample = registerGenomeSample;

/**
 * Retrieve a genetic sample's details by ID
 */
export async function getGenomeSample(sampleId: string): Promise<[string, string, string, string, string, bigint]> {
  return readContract(
    'sampleProvenance',
    'getSample',
    [sampleId]
  );
}

/**
 * Get the total count of genomic samples
 */
export async function getGenomeSampleCount(): Promise<number> {
  const count = await readContract<bigint>(
    'sampleProvenance',
    'getSampleCount'
  );
    return Number(count);
}

// Specimen functions - for genetic specimens

/**
 * Register a new genetic specimen
 */
export async function registerGeneticSpecimen(
  sampleId: string,
  specimenType: string,
  description: string,
  importance: string
): Promise<string> {
  return writeContract(
    'sampleProvenance',
    'registerSample',
    [sampleId, specimenType, description, importance]
  );
}

/**
 * Get the total count of specimens
 */
export async function getGeneticSpecimenCount(): Promise<number> {
  const count = await readContract<bigint>(
    'sampleProvenance',
    'getSampleCount'
  );
  return Number(count);
}

/**
 * Fetch details of a specific genetic specimen
 */
export async function fetchGeneticSpecimen(id: bigint): Promise<any> {
  return readContract(
    'sampleProvenance',
    'getSample',
    [id]
  );
}

// Experiment tracking functions

/**
 * Register a new CRISPR experiment - fallback to registerSample for demo purposes
 * Note: In a production environment, this would call a dedicated experiment registration function
 */
export async function registerCRISPRExperiment(
  specimenId: bigint,
  location: string,
  notes: string
): Promise<string> {
  return writeContract('experimentalDataAudit', 'recordExperiment', [
    specimenId.toString(), // Convert to string for the experiment ID
    specimenId.toString(), // Use specimen ID as the sample ID as well
    "CRISPR",              // Experiment type
    notes,                 // Results field
    location               // Metadata field
  ], {
    description: `Registered Experiment for Specimen: ${specimenId.toString()}`,
    entityId: specimenId.toString(),
    metadata: {
      location,
      notes: notes.substring(0, 100) // Limit notes length for metadata
    }
  });
}

/**
 * Get count of experiments (falls back to sample count for demo)
 */
export async function getCRISPRExperimentCount(): Promise<number> {
  // Fallback to sample count for the demo
  const count = await readContract<bigint>(
    'sampleProvenance',
    'getSampleCount'
  );
    return Number(count);
}

/**
 * Fetch details of a specific experiment (falls back to getSample with EXP- prefix)
 */
export async function fetchCRISPRExperiment(id: bigint): Promise<any> {
  // Fallback to getSample for the demo
  return readContract(
    'sampleProvenance',
    'getSample',
    [`EXP-${id.toString()}`]
  );
}

// Evidence/Results functions

/**
 * Register research evidence or results
 */
export async function registerResearchEvidence(
  specimenId: bigint,
  evidenceType: string,
  evidenceHash: string
): Promise<string> {
  return writeContract(
    'experimentalDataAudit',
    'registerEvidence',
    [specimenId, evidenceType, evidenceHash]
  );
}

/**
 * Get count of evidence records
 */
export async function getResearchEvidenceCount(): Promise<number> {
  const count = await readContract<bigint>(
    'experimentalDataAudit',
    'getEvidenceCount'
  );
    return Number(count);
}

/**
 * Fetch specific evidence record
 */
export async function fetchResearchEvidence(id: bigint): Promise<any> {
  return readContract(
    'experimentalDataAudit',
    'getEvidence',
    [id]
  );
}

// Helper functions
function getRoleBytes(role: string): Hex {
  // Map frontend role names to contract role constants
  const roleMapping: Record<string, string> = {
    'admin': 'ADMIN_ROLE',
    'researcher': 'SCIENTIST_ROLE',
    'viewer': 'REGULATOR_ROLE'
  };

  // Use the mapped role name or the original if not in mapping
  const mappedRole = roleMapping[role.toLowerCase()] || role;
  console.log('Mapping UI role', role, 'to contract role', mappedRole);
  
  // This must match exactly how the role is defined in the contract (keccak256("ADMIN_ROLE"), etc.)
  return keccak256(stringToHex(mappedRole));
}

function getWorkflowStatusValue(status: string): number {
  const statusMap: Record<string, number> = {
    "Collected": 0,
    "Processing": 1,
    "Analyzed": 2,
    "Published": 3,
    "Archived": 4
  };
  
  return statusMap[status] || 0;
}

// Access control functions for genetic data security

/**
 * Grant access role to a researcher or team member
 */
export async function grantResearcherAccess(role: string, targetAccount: string): Promise<string> {
  // Map frontend role names to contract roles
    const roleBytes = getRoleBytes(role);
    
  return writeContract('accessControl', 'grantRole', [
    roleBytes,
    targetAccount as Address
  ], {
    description: `Granted ${role} access to ${targetAccount.substring(0, 6)}...${targetAccount.substring(38)}`,
    entityId: targetAccount,
    metadata: {
      role
    }
  });
}

// Workflow functions

/**
 * Update the workflow status of a genetic sample
 */
export async function updateGeneticSampleStatus(sampleId: string, status: string, notes: string): Promise<string> {
  // First create a workflow if needed
  let workflowId = BigInt(1); // Default to first workflow for demo
    
  return writeContract('workflowAutomation', 'completeStep', [
    workflowId,
    BigInt(getWorkflowStatusValue(status)) // Use status value as step ID
  ], {
    description: `Updated ${sampleId} to ${status}`,
    entityId: sampleId,
    metadata: {
      status,
      notes: notes.substring(0, 100) // Limit notes length for metadata
    }
  });
}

// Intellectual Property functions

/**
 * Register intellectual property related to genetic research
 */
export async function registerGeneticIP(
  title: string, 
  description: string, 
  ipType: string, 
  uri: string | undefined, 
  initialOwnersString: string
): Promise<string> {
  // Convert comma-separated addresses to array
  const initialOwners = initialOwnersString
      .split(',')
    .map(addr => addr.trim())
    .filter(addr => addr.length > 0) as Address[];
  
  return writeContract('intellectualProperty', 'createIPRecord', [
    title,
    description,
    ipType,
    uri || '',
    initialOwners
  ], {
    description: `Registered IP Rights: ${title}`,
    entityId: title.replace(/\s+/g, '-').toLowerCase(),
    metadata: {
      ipType,
      owners: initialOwners
    }
  });
}

/**
 * Check if an address has admin role
 */
export async function hasAdminRole(address: string): Promise<boolean> {
  try {
    const adminRoleBytes = getRoleBytes('admin');
    console.log('Checking if address has admin role:', address);
    
    return readContract<boolean>(
      'accessControl',
      'hasRole',
      [adminRoleBytes, address as `0x${string}`]
    );
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
}

// More functions for other contract interactions would be added here 