const path = require('path');
const fs = require('fs');
const solc = require('solc');

// Contract directories
const CONTRACTS_DIR = path.join(__dirname, 'solidity');
const OUTPUT_DIR = path.join(__dirname, 'artifacts');
const ABI_DIR = path.join(__dirname, 'abis');

// Make sure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

if (!fs.existsSync(ABI_DIR)) {
  fs.mkdirSync(ABI_DIR);
}

// Get all Solidity source files
const sourceFiles = fs.readdirSync(CONTRACTS_DIR)
  .filter(file => file.endsWith('.sol'));

// Compile each contract file
async function compileContracts() {
  console.log('Compiling contracts...');
  
  for (const file of sourceFiles) {
    const contractName = path.basename(file, '.sol');
    const contractPath = path.join(CONTRACTS_DIR, file);
    
    console.log(`Compiling ${contractName}...`);
    
    try {
      // Read the Solidity source code
      const sourceCode = fs.readFileSync(contractPath, 'utf8');
      
      // Prepare compiler input
      const input = {
        language: 'Solidity',
        sources: {
          [file]: {
            content: sourceCode
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode']
            }
          },
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      };
      
      // Compile the contract
      console.log(`Compiling Solidity code...`);
      const output = JSON.parse(solc.compile(JSON.stringify(input)));
      
      // Check for errors
      if (output.errors) {
        const errorMessages = output.errors.map(error => error.message).join('\n');
        
        // Only throw error if we have actual errors (not warnings)
        if (output.errors.some(error => error.type === 'Error')) {
          throw new Error(`Compilation failed: ${errorMessages}`);
        } else {
          console.warn(`Compiler warnings for ${contractName}:\n${errorMessages}`);
        }
      }
      
      // Extract compiled contract data
      const contractOutput = output.contracts[file][contractName];
      
      // Save bytecode
      const bytecode = contractOutput.evm.bytecode.object;
      fs.writeFileSync(
        path.join(OUTPUT_DIR, `${contractName}.json`),
        JSON.stringify({
          contractName,
          bytecode,
          sourcePath: contractPath
        }, null, 2)
      );
      
      // Save ABI
      const abi = contractOutput.abi;
      fs.writeFileSync(
        path.join(ABI_DIR, `${contractName}.json`),
        JSON.stringify(abi, null, 2)
      );
      
      console.log(`Successfully compiled ${contractName}`);
    } catch (error) {
      console.error(`Failed to compile ${contractName}:`, error);
    }
  }
  
  console.log('Compilation complete');
}

// Run compilation if script is executed directly
if (require.main === module) {
  compileContracts().catch(console.error);
}

// Export for programmatic usage
module.exports = { compileContracts }; 