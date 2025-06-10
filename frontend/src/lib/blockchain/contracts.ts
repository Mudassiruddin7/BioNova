import { getPublicClient, readContract as wagmiReadContract, writeContract as wagmiWriteContract } from '@wagmi/core';
import { getWalletClient } from '@wagmi/core';
import { baseSepolia } from 'wagmi/chains';
import { parseUnits } from 'viem';
import { createConfig, http } from '@wagmi/core';

// Import contract ABIs and addresses
import AccessControlABI from '../../contracts/abis/AccessControl.json';
import ExperimentalDataAuditABI from '../../contracts/abis/ExperimentalDataAudit.json';
import IntellectualPropertyABI from '../../contracts/abis/IntellectualProperty.json';
import SampleProvenanceABI from '../../contracts/abis/SampleProvenance.json';
import WorkflowAutomationABI from '../../contracts/abis/WorkflowAutomation.json';
import contractAddresses from '../../contracts/contract-addresses.json';

// Define contract addresses
const addresses = {
  accessControl: contractAddresses.accessControl,
  experimentalDataAudit: contractAddresses.experimentalDataAudit,
  intellectualProperty: contractAddresses.intellectualProperty,
  sampleProvenance: contractAddresses.sampleProvenance,
  workflowAutomation: contractAddresses.workflowAutomation,
};

// Contract ABIs
const abis = {
  accessControl: AccessControlABI,
  experimentalDataAudit: ExperimentalDataAuditABI,
  intellectualProperty: IntellectualPropertyABI,
  sampleProvenance: SampleProvenanceABI,
  workflowAutomation: WorkflowAutomationABI,
};

// Create a local config that matches the app-wide config
// This is necessary because we can't import the app's wagmi config directly
// due to module resolution/circular dependencies
export const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});

/**
 * Reads data from a contract
 */
export async function readContract<T>({
  contract,
  method,
  args = [],
}: {
  contract: keyof typeof addresses;
  method: string;
  args?: any[];
}): Promise<T> {
  try {
    if (!addresses[contract]) throw new Error(`Contract address not found for ${contract}`);
    
    // Use the wagmi readContract action with config parameter
    const data = await wagmiReadContract(config, {
      address: addresses[contract] as `0x${string}`,
      abi: abis[contract],
      functionName: method,
      args,
      chainId: baseSepolia.id,
    });
    
    return data as T;
  } catch (error) {
    console.error(`Error reading contract ${contract}.${method}:`, error);
    throw error;
  }
}

/**
 * Writes data to a contract (executes a transaction)
 */
export async function writeContract({
  contract,
  method,
  args = [],
  value = 0n,
}: {
  contract: keyof typeof addresses;
  method: string;
  args?: any[];
  value?: bigint;
}) {
  try {
    if (!addresses[contract]) throw new Error(`Contract address not found for ${contract}`);
    
    // Use the wagmi writeContract action with config parameter
    const hash = await wagmiWriteContract(config, {
      address: addresses[contract] as `0x${string}`,
      abi: abis[contract],
      functionName: method,
      args,
      value,
      chainId: baseSepolia.id,
    });
    
    return { hash };
  } catch (error) {
    console.error(`Error writing to contract ${contract}.${method}:`, error);
    throw error;
  }
}

/**
 * Checks if the user is on the correct chain and returns status
 */
export async function checkChain(): Promise<{ isCorrectChain: boolean; chainId: number }> {
  try {
    const client = await getWalletClient(config);
    if (!client) return { isCorrectChain: false, chainId: 0 };
    
    const chainId = client.chain.id;
    const isCorrectChain = chainId === baseSepolia.id;
    
    return { isCorrectChain, chainId };
  } catch (error) {
    console.error('Error checking chain:', error);
    return { isCorrectChain: false, chainId: 0 };
  }
} 