"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChainSightStore, GenomicRecord } from '@/lib/stores/chainSightStore';
import { X, ExternalLink, Download, Compare, Clock, User, Hash, Database, FileText } from 'lucide-react';
import { EFFECTS, DNA_COLORS } from '@/lib/constants/designTokens';

export const MicroscopeView = () => {
  const { 
    isMicroscopeOpen, 
    activeRecordId, 
    records, 
    closeMicroscope 
  } = useChainSightStore();
  
  const [record, setRecord] = useState<GenomicRecord | null>(null);
  const [compareRecordId, setCompareRecordId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('sequence');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Find active record from state
  useEffect(() => {
    if (activeRecordId) {
      const foundRecord = records.find(r => r.id === activeRecordId);
      if (foundRecord) {
        setRecord(foundRecord);
      }
    } else {
      setRecord(null);
    }
    
    // Reset compare record when changing active record
    setCompareRecordId(null);
  }, [activeRecordId, records]);
  
  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMicroscopeOpen) {
        closeMicroscope();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMicroscopeOpen, closeMicroscope]);
  
  // Get compare record if selected
  const compareRecord = compareRecordId
    ? records.find(r => r.id === compareRecordId) || null
    : null;
  
  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Calculate and highlight sequence differences
  const renderSequenceDiff = (original: string, edited: string) => {
    // Simple character-by-character comparison
    const maxLength = Math.max(original.length, edited.length);
    const chunks: { text: string, type: 'unchanged' | 'added' | 'removed' | 'modified' }[] = [];
    
    let currentChunk = {
      text: '',
      type: 'unchanged' as const
    };
    
    for (let i = 0; i < maxLength; i++) {
      const origChar = original[i] || '';
      const editChar = edited[i] || '';
      
      if (origChar === editChar) {
        // If we were in a diff section, start a new unchanged section
        if (currentChunk.type !== 'unchanged') {
          chunks.push(currentChunk);
          currentChunk = { text: '', type: 'unchanged' };
        }
        currentChunk.text += origChar;
      } else {
        // We have a difference
        if (origChar && !editChar) {
          // Character was removed
          if (currentChunk.type !== 'removed') {
            chunks.push(currentChunk);
            currentChunk = { text: '', type: 'removed' };
          }
          currentChunk.text += origChar;
        } else if (!origChar && editChar) {
          // Character was added
          if (currentChunk.type !== 'added') {
            chunks.push(currentChunk);
            currentChunk = { text: '', type: 'added' };
          }
          currentChunk.text += editChar;
        } else {
          // Character was modified
          if (currentChunk.type !== 'modified') {
            chunks.push(currentChunk);
            currentChunk = { text: '', type: 'modified' };
          }
          currentChunk.text += editChar;
        }
      }
    }
    
    // Add the final chunk
    if (currentChunk.text) {
      chunks.push(currentChunk);
    }
    
    // Render the chunks with appropriate styling
    return (
      <div className="font-mono text-sm whitespace-pre-wrap break-all">
        {chunks.map((chunk, index) => {
          let style = {};
          
          switch (chunk.type) {
            case 'added':
              style = {
                backgroundColor: 'rgba(0, 255, 127, 0.2)',
                color: DNA_COLORS.tertiary,
                padding: '0 2px',
                margin: '0 1px',
                borderRadius: '2px'
              };
              break;
            case 'removed':
              style = {
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                color: '#FF5555',
                padding: '0 2px',
                margin: '0 1px',
                borderRadius: '2px',
                textDecoration: 'line-through'
              };
              break;
            case 'modified':
              style = {
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                color: DNA_COLORS.status.warning,
                padding: '0 2px',
                margin: '0 1px',
                borderRadius: '2px'
              };
              break;
            default:
              // Unchanged
              style = {
                color: DNA_COLORS.text.secondary
              };
          }
          
          return (
            <span key={index} style={style}>
              {chunk.text}
            </span>
          );
        })}
      </div>
    );
  };
  
  // Handle export
  const handleExport = (format: 'json' | 'csv') => {
    if (!record) return;
    
    const dataStr = format === 'json'
      ? JSON.stringify(record, null, 2)
      : `ID,Type,Timestamp,Block,TxHash,LoggedBy\n${record.id},${record.experimentType},${record.timestamp},${record.blockNumber},${record.txHash},${record.loggedBy}`;
      
    const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `record-${record.id.substring(0, 6)}.${format}`);
    a.click();
  };
  
  return (
    <AnimatePresence>
      {isMicroscopeOpen && record && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeMicroscope();
            }
          }}
        >
          <motion.div
            ref={containerRef}
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full md:w-[600px] h-full bg-[#080828] overflow-y-auto"
            style={{
              boxShadow: '-5px 0 30px rgba(0, 0, 0, 0.5)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 backdrop-blur-md bg-opacity-80 bg-[#080828] z-10 border-b border-gray-800">
              <div className="flex justify-between items-center p-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Microscope View</h2>
                  <div className="text-xs font-mono text-gray-400">{record.id}</div>
                </div>
                <button
                  className="p-2 rounded-full hover:bg-gray-800"
                  onClick={closeMicroscope}
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              {/* Navigation Tabs */}
              <div className="flex px-4 pb-0 border-b border-gray-800">
                {['sequence', 'metadata', 'provenance', 'notes'].map((section) => (
                  <button
                    key={section}
                    className={`py-2 px-4 ${activeSection === section ? 'border-b-2 font-medium' : 'text-gray-400 hover:text-white'}`}
                    style={{
                      borderColor: activeSection === section ? getBorderColor(record.experimentType) : 'transparent'
                    }}
                    onClick={() => setActiveSection(section)}
                  >
                    <span className="capitalize">{section}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              {/* Record Information */}
              <div className="mb-6 p-4 rounded-xl"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${getBorderColor(record.experimentType)}`,
                  boxShadow: `0 0 20px rgba(${getBorderColor(record.experimentType).replace('#', '').match(/.{1,2}/g)?.map(val => parseInt(val, 16)).join(', ') || '0, 0, 0'}, 0.15)`
                }}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} style={{ color: DNA_COLORS.text.muted }} />
                    <span style={{ color: DNA_COLORS.text.secondary }}>Timestamp:</span>
                    <span className="text-white">{formatDate(record.timestamp)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Hash size={14} style={{ color: DNA_COLORS.text.muted }} />
                    <span style={{ color: DNA_COLORS.text.secondary }}>Block:</span>
                    <span className="text-white">#{record.blockNumber}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Database size={14} style={{ color: DNA_COLORS.text.muted }} />
                    <span style={{ color: DNA_COLORS.text.secondary }}>Transaction:</span>
                    <span className="text-white font-mono text-xs truncate">{record.txHash}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} style={{ color: DNA_COLORS.text.muted }} />
                    <span style={{ color: DNA_COLORS.text.secondary }}>Logged By:</span>
                    <span className="text-white font-mono text-xs truncate">{record.loggedBy}</span>
                  </div>
                </div>
              </div>
              
              {/* Compare Selector (if in sequence view) */}
              {activeSection === 'sequence' && (
                <div className="mb-6">
                  <label 
                    className="block mb-2 text-sm font-medium"
                    style={{ color: DNA_COLORS.text.secondary }}
                  >
                    Compare With:
                  </label>
                  <select
                    value={compareRecordId || ''}
                    onChange={(e) => setCompareRecordId(e.target.value || null)}
                    className="w-full p-2 rounded bg-black bg-opacity-50 border border-gray-700 text-white"
                    style={{ color: DNA_COLORS.text.primary }}
                  >
                    <option value="">None (View Current Only)</option>
                    {records
                      .filter(r => r.id !== record.id)
                      .map(r => (
                        <option key={r.id} value={r.id}>
                          {r.experimentType.charAt(0).toUpperCase() + r.experimentType.slice(1)} - 
                          {' '}{formatDate(r.timestamp)} (ID: {r.id.substring(0, 8)}...)
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}
              
              {/* Section Content */}
              <div>
                {activeSection === 'sequence' && (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2 text-white">Gene Sequence Diff</h3>
                      <div
                        className="p-4 rounded bg-black bg-opacity-50 border border-gray-700 max-h-[400px] overflow-auto"
                      >
                        {compareRecord ? (
                          <div className="flex flex-col gap-6">
                            <div>
                              <div className="mb-2 text-sm flex justify-between">
                                <span className="font-medium text-white">Current Record</span>
                                <span className="text-gray-400">{formatDate(record.timestamp)}</span>
                              </div>
                              {renderSequenceDiff(record.geneSequence.original, record.geneSequence.edited)}
                            </div>
                            
                            <div className="border-t border-gray-800 pt-4">
                              <div className="mb-2 text-sm flex justify-between">
                                <span className="font-medium text-white">Compare Record</span>
                                <span className="text-gray-400">{formatDate(compareRecord.timestamp)}</span>
                              </div>
                              {renderSequenceDiff(compareRecord.geneSequence.original, compareRecord.geneSequence.edited)}
                            </div>
                          </div>
                        ) : (
                          renderSequenceDiff(record.geneSequence.original, record.geneSequence.edited)
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-white">Original Sequence</h4>
                        <div 
                          className="p-3 rounded font-mono text-xs overflow-auto max-h-[200px]"
                          style={{ 
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 0, 0, 0.3)',
                            color: DNA_COLORS.text.secondary
                          }}
                        >
                          {record.geneSequence.original}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-white">Edited Sequence</h4>
                        <div 
                          className="p-3 rounded font-mono text-xs overflow-auto max-h-[200px]"
                          style={{ 
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(0, 255, 127, 0.3)',
                            color: DNA_COLORS.text.secondary
                          }}
                        >
                          {record.geneSequence.edited}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeSection === 'metadata' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-white">Experiment Metadata</h3>
                    <div 
                      className="p-4 rounded bg-black bg-opacity-50 border border-gray-700 font-mono text-sm max-h-[500px] overflow-auto"
                      style={{ color: DNA_COLORS.text.secondary }}
                    >
                      <pre>{JSON.stringify(record.metadata, null, 2)}</pre>
                    </div>
                  </div>
                )}
                
                {activeSection === 'provenance' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-white">Record Provenance</h3>
                    
                    {record.ipfsLink && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2 text-white">IPFS Storage</h4>
                        <div 
                          className="p-3 rounded flex items-center gap-2"
                          style={{ 
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <span className="font-mono text-xs truncate" style={{ color: DNA_COLORS.text.secondary }}>
                            {record.ipfsLink}
                          </span>
                          <button 
                            className="ml-auto p-1.5 rounded hover:bg-black hover:bg-opacity-30"
                            onClick={() => window.open(`https://ipfs.io/ipfs/${record.ipfsLink.replace('ipfs://', '')}`)}
                          >
                            <ExternalLink size={14} className="text-cyan-400" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {record.relatedRecords && record.relatedRecords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-white">Related Records</h4>
                        <div className="space-y-2">
                          {record.relatedRecords.map(relatedId => {
                            const relatedRecord = records.find(r => r.id === relatedId);
                            return (
                              <div 
                                key={relatedId}
                                className="p-3 rounded flex items-center justify-between cursor-pointer hover:bg-black hover:bg-opacity-30"
                                style={{ 
                                  background: 'rgba(0, 0, 0, 0.2)',
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                }}
                                onClick={() => {
                                  const foundRecord = records.find(r => r.id === relatedId);
                                  if (foundRecord) {
                                    // Open the related record in Microscope View
                                    closeMicroscope();
                                    setTimeout(() => {
                                      useChainSightStore.getState().openMicroscope(relatedId);
                                    }, 100);
                                  }
                                }}
                              >
                                <div>
                                  <div className="font-mono text-xs mb-1" style={{ color: DNA_COLORS.text.muted }}>
                                    {relatedId}
                                  </div>
                                  {relatedRecord ? (
                                    <div className="text-sm flex items-center gap-2">
                                      <span className="capitalize text-white">
                                        {relatedRecord.experimentType}
                                      </span>
                                      <span style={{ color: DNA_COLORS.text.secondary }}>
                                        {formatDate(relatedRecord.timestamp)}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="text-sm italic" style={{ color: DNA_COLORS.text.muted }}>
                                      Record not loaded
                                    </div>
                                  )}
                                </div>
                                <div className="text-cyan-400">
                                  <ExternalLink size={16} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2 text-white">Blockchain Explorer</h4>
                      <div 
                        className="p-3 rounded flex justify-between"
                        style={{ 
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <span className="font-mono text-xs truncate" style={{ color: DNA_COLORS.text.secondary }}>
                          Transaction: {record.txHash.substring(0, 16)}...
                        </span>
                        <button 
                          className="ml-auto p-1.5 rounded hover:bg-black hover:bg-opacity-30"
                          onClick={() => window.open(`https://polygonscan.com/tx/${record.txHash}`)}
                        >
                          <ExternalLink size={14} className="text-cyan-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeSection === 'notes' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-white">Research Notes</h3>
                    
                    {record.notes ? (
                      <div 
                        className="p-4 rounded bg-black bg-opacity-50 border border-gray-700 max-h-[400px] overflow-auto"
                        style={{ color: DNA_COLORS.text.secondary }}
                      >
                        <p className="whitespace-pre-wrap">{record.notes}</p>
                      </div>
                    ) : (
                      <div 
                        className="p-6 rounded bg-black bg-opacity-20 border border-gray-800 flex flex-col items-center justify-center text-center"
                      >
                        <FileText size={32} className="text-gray-600 mb-2" />
                        <p className="text-gray-400">No notes were included with this record.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Action Footer */}
              <div className="mt-8 flex gap-4 justify-end">
                <button
                  className="px-4 py-2 rounded-lg flex items-center gap-2 border border-gray-700 hover:bg-gray-800"
                  style={{ color: DNA_COLORS.text.secondary }}
                  onClick={() => handleExport('json')}
                >
                  <Download size={16} />
                  <span>Export JSON</span>
                </button>
                
                <button
                  className="px-4 py-2 rounded-lg flex items-center gap-2 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${DNA_COLORS.primary} 0%, ${DNA_COLORS.secondary} 100%)`,
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
                  }}
                  onClick={() => window.open(`https://polygonscan.com/tx/${record.txHash}`)}
                >
                  <ExternalLink size={16} />
                  <span>View On Explorer</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Helper function to get color based on experiment type
function getBorderColor(type: string): string {
  switch (type) {
    case 'prediction':
      return DNA_COLORS.primary;
    case 'sensor':
      return DNA_COLORS.secondary;
    case 'manual':
      return DNA_COLORS.tertiary;
    default:
      return DNA_COLORS.primary;
  }
} 