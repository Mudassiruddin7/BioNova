"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChainSightStore, GenomicRecord } from '@/lib/stores/chainSightStore';
import { EFFECTS, DNA_COLORS, ANIMATIONS } from '@/lib/constants/designTokens';
import { RecordCard } from './RecordCard';
import { HelixFlow } from './HelixFlow';

export const DataStream = () => {
  const { 
    records, isLoading, viewMode, 
    search, filters, sortOrder,
    openMicroscope
  } = useChainSightStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [filteredRecords, setFilteredRecords] = useState<GenomicRecord[]>([]);
  
  // Filter and sort records based on search, filters, and sortOrder
  useEffect(() => {
    let result = [...records];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(record => 
        record.id.toLowerCase().includes(searchLower) ||
        record.loggedBy.toLowerCase().includes(searchLower) ||
        record.geneSequence.original.toLowerCase().includes(searchLower) ||
        record.geneSequence.edited.toLowerCase().includes(searchLower) ||
        (record.notes && record.notes.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply experiment type filter
    if (filters.experimentTypes && filters.experimentTypes.length > 0) {
      result = result.filter(record => 
        filters.experimentTypes.includes(record.experimentType)
      );
    }
    
    // Apply date range filter
    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      result = result.filter(record => 
        record.timestamp >= start && record.timestamp <= end
      );
    }
    
    // Apply logged by filter
    if (filters.loggedBy) {
      result = result.filter(record => 
        record.loggedBy.toLowerCase() === filters.loggedBy?.toLowerCase()
      );
    }
    
    // Apply sorting
    if (sortOrder === 'newest') {
      result.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortOrder === 'recordId') {
      result.sort((a, b) => a.id.localeCompare(b.id));
    }
    
    setFilteredRecords(result);
  }, [records, search, filters, sortOrder]);

  return (
    <div id="data-stream" ref={containerRef}>
      <div className="flex items-center justify-between mb-6">
        <motion.h2 
          className="text-2xl md:text-3xl font-bold"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={ANIMATIONS.transitions.medium}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-cyan-200">
            Genomic Data Stream
          </span>
        </motion.h2>
        
        <motion.div 
          className="text-sm text-gray-400"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={ANIMATIONS.transitions.medium}
        >
          {filteredRecords.length} 
          {filteredRecords.length === 1 ? ' record' : ' records'} found
        </motion.div>
      </div>
      
      {isLoading ? (
        // Loading Skeleton
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="h-52 rounded-xl animate-pulse"
              style={{
                background: 'rgba(30, 30, 60, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            />
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        // Empty State
        <motion.div 
          className="flex flex-col items-center justify-center py-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-6xl mb-4">🧬</div>
          <h3 className="text-xl font-semibold mb-2">No Records Found</h3>
          <p className="text-gray-400 max-w-md">
            There are no records matching your current filters. Try adjusting your search criteria.
          </p>
        </motion.div>
      ) : (
        // Data Display - Toggle between Grid and Helix views
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid-view"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence>
                {filteredRecords.map((record, index) => (
                  <RecordCard 
                    key={record.id}
                    record={record}
                    index={index}
                    onClick={() => openMicroscope(record.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="helix-view"
              className="h-[50vh] w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HelixFlow 
                records={filteredRecords}
                onNodeClick={(recordId) => openMicroscope(recordId)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
      
      {/* Load More Button - for real implementation with pagination */}
      {filteredRecords.length > 10 && (
        <div className="flex justify-center mt-10">
          <motion.button
            className="px-6 py-3 rounded-xl text-white font-medium"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `1px solid ${DNA_COLORS.primary}`,
            }}
            whileHover={{ 
              scale: 1.03, 
              boxShadow: EFFECTS.glows.cyan 
            }}
            whileTap={{ scale: 0.97 }}
          >
            Load More Records
          </motion.button>
        </div>
      )}
    </div>
  );
}; 