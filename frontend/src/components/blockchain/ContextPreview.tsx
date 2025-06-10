'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useBlockchainStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export function ContextPreview() {
  const { dataToVerify } = useBlockchainStore();
  const [copied, setCopied] = useState(false);

  // If no data to verify, show a message
  if (!dataToVerify) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No data available for verification.</p>
        <p className="text-sm text-gray-400 mt-2">
          Please make a prediction or monitor data first.
        </p>
      </Card>
    );
  }

  // Format prediction data for display
  const formatPredictionData = () => {
    const { originalSequence, predictedSequence, editCount, editPositions } = dataToVerify.data;
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Original Sequence</h3>
          <p className="mt-1 font-mono text-sm overflow-x-auto bg-gray-50 p-2 rounded">
            {originalSequence}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Predicted Sequence</h3>
          <p className="mt-1 font-mono text-sm overflow-x-auto bg-gray-50 p-2 rounded">
            {predictedSequence}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Edit Count</h3>
            <p className="mt-1 font-medium">{editCount}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Edit Positions</h3>
            <p className="mt-1 font-medium">{editPositions.join(', ')}</p>
          </div>
        </div>
      </div>
    );
  };

  // Format monitoring data for display
  const formatMonitoringData = () => {
    const { temperature, humidity, timestamp } = dataToVerify.data;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Temperature</h3>
            <p className="mt-1 font-medium">{temperature.toFixed(1)} °C</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Humidity</h3>
            <p className="mt-1 font-medium">{humidity.toFixed(1)} %</p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
          <p className="mt-1 font-medium">{formatDate(timestamp)}</p>
        </div>
        {dataToVerify.data.insights && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Insights</h3>
            <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
              {dataToVerify.data.insights}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Handle copy to clipboard
  const copyToClipboard = () => {
    const text = JSON.stringify(dataToVerify, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Data to Verify</h2>
            <p className="text-sm text-gray-500">
              {dataToVerify.type === 'prediction' ? 'CRISPR Prediction' : 'Lab Environment'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex items-center"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy JSON
              </>
            )}
          </Button>
        </div>

        {dataToVerify.type === 'prediction' ? formatPredictionData() : formatMonitoringData()}
      </Card>
    </motion.div>
  );
} 