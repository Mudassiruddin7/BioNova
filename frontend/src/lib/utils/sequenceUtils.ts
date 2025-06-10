export interface SequenceDifference {
  type: 'addition' | 'deletion' | 'substitution';
  position: number;
  original?: string;
  new?: string;
}

export interface SequenceComparisonResult {
  differences: SequenceDifference[];
  editCount: number;
  matchPercentage: number;
}

export function compareSequences(
  originalSequence: string,
  editedSequence: string
): SequenceComparisonResult {
  const differences: SequenceDifference[] = [];
  let editCount = 0;

  // Simple implementation for direct character-by-character comparison
  // In a real application, you might use a more sophisticated algorithm like Needleman-Wunsch
  const maxLength = Math.max(originalSequence.length, editedSequence.length);
  
  for (let i = 0; i < maxLength; i++) {
    const originalChar = originalSequence[i];
    const editedChar = editedSequence[i];
    
    if (originalChar === undefined && editedChar !== undefined) {
      // Addition
      differences.push({
        type: 'addition',
        position: i,
        new: editedChar,
      });
      editCount++;
    } else if (originalChar !== undefined && editedChar === undefined) {
      // Deletion
      differences.push({
        type: 'deletion',
        position: i,
        original: originalChar,
      });
      editCount++;
    } else if (originalChar !== editedChar) {
      // Substitution
      differences.push({
        type: 'substitution',
        position: i,
        original: originalChar,
        new: editedChar,
      });
      editCount++;
    }
  }

  const matchPercentage = ((maxLength - editCount) / maxLength) * 100;
  
  return {
    differences,
    editCount,
    matchPercentage: Math.round(matchPercentage * 100) / 100, // Round to 2 decimal places
  };
}

export function exportToTextFile(
  originalSequence: string, 
  editedSequence: string, 
  explanation: string,
  predictionId: string
): void {
  const comparison = compareSequences(originalSequence, editedSequence);
  
  const content = `
BioNova AI Studio - CRISPR Prediction Results
==============================================
Prediction ID: ${predictionId}
Date: ${new Date().toLocaleString()}

Original Sequence:
${originalSequence}

Edited Sequence:
${editedSequence}

Edits Made: ${comparison.editCount}
Match Percentage: ${comparison.matchPercentage}%

Edit Details:
${comparison.differences.map(diff => {
  if (diff.type === 'addition') {
    return `Position ${diff.position}: Added ${diff.new}`;
  } else if (diff.type === 'deletion') {
    return `Position ${diff.position}: Deleted ${diff.original}`;
  } else {
    return `Position ${diff.position}: Changed ${diff.original} to ${diff.new}`;
  }
}).join('\n')}

AI Explanation:
${explanation}
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prediction_${predictionId}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 