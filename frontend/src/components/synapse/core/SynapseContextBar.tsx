'use client'

import React from 'react';
import { useSynapse } from '../../../lib/hooks/synapse/SynapseProvider';
import { Info, AlertTriangle, Clock, Database } from 'lucide-react';

const SynapseContextBar: React.FC = () => {
  const { contextData, isChatOpen } = useSynapse();
  
  if (!isChatOpen) return null;
  
  // Get page-specific context information
  const getContextInfo = () => {
    switch (contextData.pageType) {
      case 'gene-predictor':
        return {
          title: 'Gene Analysis Context',
          icon: <Database className="text-green-500" size={16} />,
          content: contextData.relevantId 
            ? `Viewing gene sequence with ID: ${contextData.relevantId}` 
            : 'Gene prediction and analysis context active'
        };
      case 'lab-monitor':
        return {
          title: 'Lab Monitor Context',
          icon: <AlertTriangle className="text-blue-500" size={16} />,
          content: 'Synapse has access to sensor data and lab monitoring information'
        };
      case 'blockchain':
        return {
          title: 'Blockchain Context',
          icon: <Database className="text-purple-500" size={16} />,
          content: contextData.relevantId 
            ? `Viewing transaction: ${contextData.relevantId.substring(0, 10)}...` 
            : 'Blockchain transaction analysis context active'
        };
      default:
        return {
          title: 'General Context',
          icon: <Info className="text-slate-500" size={16} />,
          content: 'Ask Synapse anything about BioNova AI Studio'
        };
    }
  };
  
  const { title, icon, content } = getContextInfo();
  
  return (
    <div className="fixed bottom-[516px] right-4 z-40 max-w-[350px] p-2 bg-white dark:bg-slate-800 rounded-t-lg border border-slate-200 dark:border-slate-700 shadow-md">
      <div className="flex items-center mb-1">
        {icon}
        <span className="ml-1 text-xs font-medium text-slate-700 dark:text-slate-300">
          {title}
        </span>
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-400">
        {content}
      </div>
      <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-500">
        <Clock size={12} className="mr-1" />
        <span>Updated just now</span>
      </div>
    </div>
  );
};

export default SynapseContextBar; 