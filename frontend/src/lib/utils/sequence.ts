export interface SequenceComparison {
  originalWithHighlights: {
    text: string;
    highlighted: boolean;
  }[];
  editedWithHighlights: {
    text: string;
    highlighted: boolean;
  }[];
  originalHighlighted: string;
  editedHighlighted: string;
  editCount: number;
  editPositions: number[];
}

export function compareSequences(
  originalSequence: string,
  editedSequence: string
): SequenceComparison {
  const originalWithHighlights: { text: string; highlighted: boolean }[] = [];
  const editedWithHighlights: { text: string; highlighted: boolean }[] = [];
  const editPositions: number[] = [];
  
  const maxLength = Math.max(originalSequence.length, editedSequence.length);
  let editCount = 0;
  
  for (let i = 0; i < maxLength; i++) {
    const originalChar = originalSequence[i] || '';
    const editedChar = editedSequence[i] || '';
    
    if (originalChar !== editedChar) {
      originalWithHighlights.push({ text: originalChar, highlighted: true });
      editedWithHighlights.push({ text: editedChar, highlighted: true });
      editCount++;
      editPositions.push(i + 1); // 1-indexed position
    } else {
      originalWithHighlights.push({ text: originalChar, highlighted: false });
      editedWithHighlights.push({ text: editedChar, highlighted: false });
    }
  }
  
  // Generate HTML highlighted versions
  let originalHighlighted = '';
  let editedHighlighted = '';
  
  originalWithHighlights.forEach(({ text, highlighted }) => {
    if (highlighted) {
      originalHighlighted += `<span style="background-color: rgba(239, 68, 68, 0.2); color: rgb(220, 38, 38);">${text}</span>`;
    } else {
      originalHighlighted += text;
    }
  });
  
  editedWithHighlights.forEach(({ text, highlighted }) => {
    if (highlighted) {
      editedHighlighted += `<span style="background-color: rgba(34, 197, 94, 0.2); color: rgb(22, 163, 74);">${text}</span>`;
    } else {
      editedHighlighted += text;
    }
  });
  
  return {
    originalWithHighlights,
    editedWithHighlights,
    originalHighlighted,
    editedHighlighted,
    editCount,
    editPositions,
  };
}

export function exportResults(
  comparison: SequenceComparison,
  predictionId: string = ""
): void {
  const content = {
    predictionId: predictionId || `seq-${new Date().getTime()}`,
    timestamp: new Date().toISOString(),
    editCount: comparison.editCount,
    editPositions: comparison.editPositions,
  };
  
  const jsonString = JSON.stringify(content, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `sequence-comparison-${predictionId || new Date().getTime()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format a DNA sequence with proper styling for display
export function formatDNASequence(sequence: string, chunkSize = 10, lineBreak = 50) {
  let formatted = '';
  
  for (let i = 0; i < sequence.length; i++) {
    if (i > 0 && i % chunkSize === 0) {
      formatted += ' ';
    }
    if (i > 0 && i % lineBreak === 0) {
      formatted += '\n';
    }
    formatted += sequence[i];
  }
  
  return formatted;
}

// Get color class based on nucleotide
export function getNucleotideColor(nucleotide: string) {
  switch (nucleotide.toUpperCase()) {
    case 'A':
      return 'text-green-600';
    case 'T':
      return 'text-red-600';
    case 'G':
      return 'text-amber-600';
    case 'C':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

// Get descriptive text for an edit type
export function getEditTypeDescription(type: 'addition' | 'deletion' | 'substitution') {
  switch (type) {
    case 'addition':
      return 'Addition';
    case 'deletion':
      return 'Deletion';
    case 'substitution':
      return 'Substitution';
    default:
      return 'Edit';
  }
} 