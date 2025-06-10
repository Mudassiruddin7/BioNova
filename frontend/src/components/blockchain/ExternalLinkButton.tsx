'use client';

import { motion } from 'framer-motion';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatAddress } from '@/lib/utils';

export function ExternalLinkButton() {
  const { user } = useAuth();
  
  // Get external blockchain dApp URL from environment variable or use default
  const blockchainDAppURL = process.env.NEXT_PUBLIC_BLOCKCHAIN_DAPP_URL || 'https://example-blockchain-dapp.com';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="p-6 bg-indigo-50 border-indigo-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 bg-indigo-100 p-3 rounded-full">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-indigo-800">
              Ready for Blockchain Verification
            </h3>
            <p className="mt-2 text-sm text-indigo-700">
              Click the button below to proceed to our secure blockchain portal. Your connected 
              wallet ({user ? formatAddress(user.walletAddress) : 'Not connected'}) will be used to 
              sign the transaction.
            </p>
            <div className="mt-4">
              <a
                href={blockchainDAppURL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Verify Data on Blockchain
                </Button>
              </a>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
} 