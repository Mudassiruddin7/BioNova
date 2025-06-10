import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { compareSequences } from '@/lib/utils/sequence';
import { useBlockchainVerification } from '@/lib/hooks/useBlockchainVerification';
import { toast } from 'sonner';
import { Loader2, CheckCircle, Download, Shield } from 'lucide-react';

interface PredictionResultsProps {
  predictionId: string;
  originalSequence: string;
  editedSequence: string;
  explanation: string;
  timestamp: string;
}

export function PredictionResults({
  predictionId,
  originalSequence,
  editedSequence,
  explanation,
  timestamp,
}: PredictionResultsProps) {
  const comparison = compareSequences(originalSequence, editedSequence);
  const { isVerifying, isVerified, transactionHash, verify } = useBlockchainVerification();

  const handleVerify = async () => {
    if (isVerified) {
      toast.info('This prediction is already verified on the blockchain');
      return;
    }

    await verify({
      predictionId,
      originalSequence,
      editedSequence,
      timestamp,
    });
  };

  const handleExport = () => {
    const jsonData = {
      predictionId,
      originalSequence,
      editedSequence,
      editCount: comparison.editCount,
      editPositions: comparison.editPositions,
      explanation,
      timestamp,
      blockchainVerification: isVerified ? { transactionHash } : null,
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prediction-${predictionId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle>CRISPR Prediction Results</CardTitle>
        <CardDescription>
          Prediction {predictionId} • {new Date(timestamp).toLocaleString()}
          {isVerified && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" /> Verified on Blockchain
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Original Sequence</h3>
          <div className="p-4 bg-slate-50 rounded-md font-mono text-sm overflow-x-auto">
            {comparison.originalWithHighlights.map((segment, i) => (
              <span
                key={`orig-${i}`}
                className={segment.highlighted ? 'bg-red-200 rounded px-0.5' : ''}
              >
                {segment.text}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Edited Sequence</h3>
          <div className="p-4 bg-slate-50 rounded-md font-mono text-sm overflow-x-auto">
            {comparison.editedWithHighlights.map((segment, i) => (
              <span
                key={`edit-${i}`}
                className={segment.highlighted ? 'bg-green-200 rounded px-0.5' : ''}
              >
                {segment.text}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Edit Summary</h3>
          <p className="text-sm">
            {comparison.editCount} edit{comparison.editCount !== 1 ? 's' : ''} at position{comparison.editCount !== 1 ? 's' : ''}: {comparison.editPositions.join(', ')}
          </p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">AI Explanation</h3>
          <div className="p-4 bg-slate-50 rounded-md text-sm">
            {explanation}
          </div>
        </div>

        {isVerified && transactionHash && (
          <div>
            <h3 className="text-sm font-medium mb-2">Blockchain Verification</h3>
            <div className="p-4 bg-slate-50 rounded-md text-sm font-mono break-all">
              <p>Transaction Hash: {transactionHash}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" /> Export Results
        </Button>
        <Button
          onClick={handleVerify}
          disabled={isVerifying || isVerified}
          className={isVerified ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...
            </>
          ) : isVerified ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" /> Verified
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" /> Verify on Blockchain
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 