'use client';

import { motion } from 'framer-motion';
import { Wallet, ExternalLink, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatAddress } from '@/lib/utils';

export function WalletInfoDisplay() {
  const { user, isAuthenticated } = useAuth();
  
  // Base block explorer URL
  const blockExplorerURL = 'https://sepolia.basescan.org/address/';

  if (!isAuthenticated || !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="p-6 bg-orange-50 border-orange-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800">
                Not Connected
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Please connect your wallet to verify data on the blockchain.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 bg-indigo-100 p-3 rounded-full">
            <Wallet className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-800">
              Connected Wallet
            </h3>
            <div className="mt-2 flex items-center flex-wrap">
              <span className="font-mono bg-gray-100 px-3 py-1 rounded text-gray-800 mr-2 mb-2">
                {user.walletAddress}
              </span>
              <Button
                variant="ghost"
                size="sm"
                as="a"
                href={`${blockExplorerURL}${user.walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center mb-2"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View on Explorer
              </Button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              This wallet will be used to sign your blockchain verification transaction.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
} 