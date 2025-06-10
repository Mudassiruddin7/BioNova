"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Eye, Clock, User, FileText } from 'lucide-react';
import { GenomicRecord } from '@/lib/stores/chainSightStore';
import { EFFECTS, DNA_COLORS } from '@/lib/constants/designTokens';

interface RecordCardProps {
  record: GenomicRecord;
  index: number;
  onClick: () => void;
}

export const RecordCard = ({ record, index, onClick }: RecordCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format timestamp to relative time (e.g., "5 minutes ago")
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };
  
  // Get border and glow colors based on experiment type
  const getBorderColor = () => {
    switch (record.experimentType) {
      case 'prediction':
        return DNA_COLORS.primary;
      case 'sensor':
        return DNA_COLORS.secondary;
      case 'manual':
        return DNA_COLORS.tertiary;
      default:
        return DNA_COLORS.primary;
    }
  };
  
  // Get icon based on experiment type
  const getTypeIcon = () => {
    switch (record.experimentType) {
      case 'prediction':
        return '🧪';
      case 'sensor':
        return '📊';
      case 'manual':
        return '📝';
      default:
        return '🧬';
    }
  };
  
  // Format address to short form
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Format gene snippet
  const formatGeneSnippet = (sequence: string) => {
    if (sequence.length <= 12) return sequence;
    return `${sequence.substring(0, 12)}...`;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.19, 1, 0.22, 1] // Expo.easeOut for smooth animation
      }}
      whileHover={{
        y: -5,
        transition: { duration: 0.2 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="cursor-pointer group perspective-1000"
    >
      <motion.div
        className="relative rounded-xl overflow-hidden h-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered ? 'rotateY(5deg)' : 'rotateY(0deg)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        <div 
          className="p-5 h-full"
          style={{
            background: EFFECTS.glassMorphism.background,
            backdropFilter: EFFECTS.glassMorphism.backdropFilter,
            border: `1px solid ${getBorderColor()}`,
            boxShadow: isHovered 
              ? `0 0 20px rgba(${getBorderColor().replace('#', '').match(/.{1,2}/g)?.map(val => parseInt(val, 16)).join(', ') || '0, 0, 0'}, 0.3)`
              : EFFECTS.shadows.medium
          }}
        >
          {/* Header Section */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-mono text-gray-400 mb-1">
                {record.id}
              </div>
              <h3 className="font-semibold text-white">
                {getTypeIcon()} <span className="capitalize">{record.experimentType}</span> Record
              </h3>
            </div>
            <div 
              className="px-2 py-1 rounded text-xs"
              style={{
                background: `rgba(${getBorderColor().replace('#', '').match(/.{1,2}/g)?.map(val => parseInt(val, 16)).join(', ') || '0, 0, 0'}, 0.2)`,
                color: getBorderColor()
              }}
            >
              Block #{record.blockNumber}
            </div>
          </div>
          
          {/* Gene Sequence Preview */}
          <div 
            className="mb-4 p-3 rounded font-mono text-xs overflow-hidden"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              maxHeight: '80px'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: DNA_COLORS.text.secondary }}>Original:</span>
              <span style={{ color: '#FF5555' }}>{formatGeneSnippet(record.geneSequence.original)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: DNA_COLORS.text.secondary }}>Edited:</span>
              <span style={{ color: '#55FF55' }}>{formatGeneSnippet(record.geneSequence.edited)}</span>
            </div>
          </div>
          
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5" style={{ color: DNA_COLORS.text.secondary }}>
              <Clock size={12} />
              <span>{formatRelativeTime(record.timestamp)}</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: DNA_COLORS.text.secondary }}>
              <User size={12} />
              <span className="font-mono">{formatAddress(record.loggedBy)}</span>
            </div>
          </div>
          
          {/* Notes Preview (if available) */}
          {record.notes && (
            <div 
              className="mt-3 text-xs truncate"
              style={{ color: DNA_COLORS.text.secondary }}
            >
              <div className="flex items-center gap-1.5">
                <FileText size={12} />
                <span className="truncate">{record.notes}</span>
              </div>
            </div>
          )}
          
          {/* Actions on Hover */}
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <button 
              className="px-4 py-2 rounded-lg flex items-center gap-2 bg-white bg-opacity-10 backdrop-blur-sm text-white font-medium"
              onClick={onClick}
            >
              <Eye size={16} />
              <span>View Details</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}; 