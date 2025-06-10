"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Textarea } from "./textarea";
import { Badge } from "./badge";
import { compareSequences, exportResults } from "@/lib/utils/sequence";
import { useToast } from "@/components/ui/use-toast";

interface SequenceComparerProps {
  originalSequence?: string;
  editedSequence?: string;
  predictionId?: string;
  readOnly?: boolean;
}

export function SequenceComparer({
  originalSequence = "",
  editedSequence = "",
  predictionId = "",
  readOnly = false,
}: SequenceComparerProps) {
  const [original, setOriginal] = useState(originalSequence);
  const [edited, setEdited] = useState(editedSequence);
  const [comparison, setComparison] = useState<ReturnType<typeof compareSequences> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (original && edited) {
      const result = compareSequences(original, edited);
      setComparison(result);
    } else {
      setComparison(null);
    }
  }, [original, edited]);

  const handleExport = () => {
    if (!comparison) return;
    
    exportResults(comparison, predictionId);
    
    toast({
      title: "Export successful",
      description: "Sequence comparison results have been downloaded",
    });
  };

  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>
        
        <TabsContent value="input" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Original Sequence</h3>
              <Textarea
                placeholder="Paste original DNA sequence here..."
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                className="font-mono h-[300px]"
                readOnly={readOnly}
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Edited Sequence</h3>
              <Textarea
                placeholder="Paste edited DNA sequence here..."
                value={edited}
                onChange={(e) => setEdited(e.target.value)}
                className="font-mono h-[300px]"
                readOnly={readOnly}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="comparison" className="space-y-4">
          {comparison ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{comparison.editCount} edits</Badge>
                </div>
                <Button onClick={handleExport}>Export Results</Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-md">
                  <h3 className="text-sm font-medium mb-2">Original Sequence</h3>
                  <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[400px] p-2 bg-muted/50 rounded">
                    <code dangerouslySetInnerHTML={{ __html: comparison.originalHighlighted }} />
                  </pre>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h3 className="text-sm font-medium mb-2">Edited Sequence</h3>
                  <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[400px] p-2 bg-muted/50 rounded">
                    <code dangerouslySetInnerHTML={{ __html: comparison.editedHighlighted }} />
                  </pre>
                </div>
              </div>
              
              <div className="p-4 border rounded-md">
                <h3 className="text-sm font-medium mb-2">Edit Positions</h3>
                <div className="flex flex-wrap gap-2">
                  {comparison.editPositions.map((pos) => (
                    <Badge key={pos} variant="secondary">
                      Position {pos}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] border rounded-md">
              <p className="text-muted-foreground">
                Enter sequences to view comparison
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 