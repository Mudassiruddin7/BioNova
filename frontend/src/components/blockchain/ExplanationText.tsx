'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { useBlockchainStore } from '@/lib/store';

export function ExplanationText() {
  const { dataToVerify } = useBlockchainStore();
  const dataType = dataToVerify?.type || 'data';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Blockchain Verification
        </h2>
        
        <div className="space-y-4 text-gray-600">
          <p>
          BioNova AI Studio utilizes blockchain technology to ensure secure,
            tamper-proof records of your {dataType === 'prediction' ? 'CRISPR predictions' : 'lab monitoring data'}.
          </p>
          
          <h3 className="text-lg font-medium text-gray-700 mt-6">Benefits</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <span className="font-medium">Immutability:</span> Once stored on the blockchain, 
              data becomes permanent and unchangeable, preserving the integrity of your research.
            </li>
            <li>
              <span className="font-medium">Transparency:</span> Data entries can be  
              independently verified without exposing your private systems, confirming when and how they were recorded.
            </li>
            <li>
              <span className="font-medium">Reproducibility:</span> Enables other researchers to 
              replicate your conditions or outcomes, supporting credible and reproducible science.
            </li>
            <li>
              <span className="font-medium">Ownership:</span> Your wallet address is associated with 
              the data, offering cryptographic proof of authorship and data ownership.
            </li>
          </ul>
          
          <h3 className="text-lg font-medium text-gray-700 mt-6">How It Works</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Select the data you want to verify.</li>
            <li>Click the "Verify Data on Blockchain" button</li>
            <li>If prompted, connect your Base wallet.</li>
            <li>Approve the transaction in your wallet interface.</li>
            <li>After confirmation, you’ll receive a transaction hash and a link to view it on the blockchain explorer.</li>
          </ol>
          
          <p className="mt-4 text-sm text-gray-500">
            Note: Blockchain verification requires a small gas fee on the Base network.
          </p>
        </div>
      </Card>
    </motion.div>
  );
} 