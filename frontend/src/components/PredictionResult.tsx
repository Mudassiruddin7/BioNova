import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { compareSequences, formatDNASequence, getNucleotideColor, getEditTypeDescription } from '@/lib/utils/sequence';
import { useBlockchainVerification } from '@/lib/hooks/useBlockchainVerification';
import { Loader2 } from 'lucide-react';

interface PredictionResultProps {
  originalSequence: string;
  editedSequence: string;
  aiExplanation: string;
  predictionId: string;
}

export function PredictionResult({
  originalSequence,
  editedSequence,
  aiExplanation,
  predictionId,
}: PredictionResultProps) {
  const [activeTab, setActiveTab] = useState('visual');
  const { verify, isVerifying, isVerified, verificationError } = useBlockchainVerification();

  const comparison = compareSequences(originalSequence, editedSequence);
  
  const handleVerify = () => {
    verify({
      predictionId,
      originalSequence,
      editedSequence,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>CRISPR Prediction Result</span>
          <div className="flex gap-2">
            {comparison.editCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {comparison.editCount} {comparison.editCount === 1 ? 'edit' : 'edits'}
              </Badge>
            )}
            {isVerified && (
              <Badge variant="success" className="bg-green-100 text-green-800">
                Verified on Blockchain
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Analysis of predicted CRISPR-Cas9 edits on your DNA sequence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="visual">Visual Comparison</TabsTrigger>
            <TabsTrigger value="raw">Raw Sequences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visual" className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-md overflow-x-auto">
              <div className="font-mono whitespace-pre text-sm">
                <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[400px] p-2 bg-muted/50 rounded">
                  <code dangerouslySetInnerHTML={{ __html: comparison.originalHighlighted }} />
                </pre>
              </div>
            </div>
            
            {comparison.editPositions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Edit Positions:</h4>
                <div className="flex flex-wrap gap-2">
                  {comparison.editPositions.map((position, idx) => (
                    <Badge key={idx} variant="outline">
                      Position {position}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">AI Explanation:</h4>
              <p className="text-sm text-gray-700">{aiExplanation}</p>
            </div>
          </TabsContent>
          
          <TabsContent value="raw" className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Original Sequence:</h4>
              <Textarea 
                value={formatDNASequence(originalSequence)} 
                readOnly 
                className="font-mono h-24"
              />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Edited Sequence:</h4>
              <Textarea 
                value={formatDNASequence(editedSequence)} 
                readOnly 
                className="font-mono h-24"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const blob = new Blob([
              `BioNova AI Studio - Gene Prediction\n`,
              `Prediction ID: ${predictionId}\n\n`,
              `Original Sequence:\n${originalSequence}\n\n`,
              `Edited Sequence:\n${editedSequence}\n\n`,
              `AI Explanation:\n${aiExplanation}`
            ], { type: 'text/plain' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prediction-${predictionId}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export Results
        </Button>
        <Button 
          onClick={handleVerify}
          disabled={isVerifying || isVerified}
        >
          {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isVerified ? 'Verified ✓' : 'Verify on Blockchain'}
        </Button>
      </CardFooter>
    </Card>
  );
} 