'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { useAIAssistant } from '@/lib/hooks/useAIAssistant';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AIGuidanceProps {
  dataType: 'prediction' | 'monitoring';
  className?: string;
}

export function AIGuidance({ dataType, className }: AIGuidanceProps) {
  const { getBlockchainGuidance, isProcessing } = useAIAssistant();
  const [guidance, setGuidance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchGuidance = async () => {
      try {
        const text = await getBlockchainGuidance(dataType);
        setGuidance(text);
      } catch (err: any) {
        setError(err.message || 'Failed to load guidance');
      }
    };

    fetchGuidance();
  }, [dataType, getBlockchainGuidance]);

  if (dismissed || (!guidance && !isProcessing && !error)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn("w-full", className)}
    >
      <Card className="p-4 border-indigo-200 bg-indigo-50">
        <div className="flex">
          <div className="flex-shrink-0 mt-0.5">
            <Info className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="ml-3 flex-1">
            <div className="flex justify-between">
              <h3 className="text-sm font-medium text-indigo-800">Blockchain Verification Guidance</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 -mr-1"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 text-sm text-indigo-700">
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                  <span>Loading guidance...</span>
                </div>
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : (
                <p className="whitespace-pre-wrap">{guidance}</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
} 