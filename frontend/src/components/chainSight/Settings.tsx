"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings as SettingsIcon, Volume2, VolumeX, Info, ShieldCheck, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useChainSightStore } from '@/lib/stores/chainSightStore';
import { EFFECTS, GENOMIC_THEME } from '@/lib/constants/designTokens';
import { useWalletState, ROLES } from '@/lib/hooks/useWalletState';

export const Settings = () => {
  const { isSettingsOpen, toggleSettings } = useChainSightStore();
  const { isWalletConnected, userRole, isWrongNetwork } = useWalletState();
  
  // Settings state
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  // Get contract info
  const contractAddress = '0x123...abc'; // Placeholder
  const chainName = 'Polygon';
  const chainId = '137';
  
  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        toggleSettings();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen, toggleSettings]);
  
  // Toggle sound setting
  const handleToggleSound = () => {
    setSoundEnabled(!soundEnabled);
    // In a real app, would also store this in localStorage or user preferences
  };
  
  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              toggleSettings();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[#080828] rounded-xl overflow-hidden relative"
            style={{
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <SettingsIcon size={18} className="text-cyan-400" />
                <h2 className="text-lg font-bold text-white">Settings & Status</h2>
              </div>
              <button
                className="p-2 rounded-full hover:bg-gray-800"
                onClick={toggleSettings}
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Connection Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Network Status</h3>
                <div className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isWalletConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <span className="text-sm" style={{ color: GENOMIC_THEME.text.secondary }}>Connected to {chainName}</span>
                  </div>
                  {isWrongNetwork && (
                    <div className="flex items-center gap-1 text-orange-400 text-xs">
                      <XCircle size={14} />
                      <span>Wrong Network</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="text-sm font-medium">Chain ID</div>
                  <div className="text-sm font-mono" style={{ color: GENOMIC_THEME.text.secondary }}>{chainId}</div>
                </div>
              </div>
              
              {/* Contract Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Contract Address</h3>
                <div className="p-3 rounded-lg flex items-center justify-between"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="font-mono text-sm truncate" style={{ color: GENOMIC_THEME.text.secondary }}>
                    {contractAddress}
                  </div>
                  <button 
                    className="ml-2 p-1.5 rounded hover:bg-black hover:bg-opacity-30 text-cyan-400"
                    onClick={() => {
                      navigator.clipboard.writeText(contractAddress);
                      // In a real app, would show a toast notification
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 2V1H10V2H5ZM4.75 0C4.33579 0 4 0.335786 4 0.75V1H3.5C2.67157 1 2 1.67157 2 2.5V12.5C2 13.3284 2.67157 14 3.5 14H11.5C12.3284 14 13 13.3284 13 12.5V2.5C13 1.67157 12.3284 1 11.5 1H11V0.75C11 0.335786 10.6642 0 10.25 0H4.75ZM11 2V2.25C11 2.66421 10.6642 3 10.25 3H4.75C4.33579 3 4 2.66421 4 2.25V2H3.5C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V2.5C12 2.22386 11.7761 2 11.5 2H11Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* User Role */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Your Role</h3>
                <div className="p-3 rounded-lg flex items-center gap-3"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {userRole === ROLES.ADMIN ? (
                    <ShieldCheck size={18} className="text-yellow-400" />
                  ) : userRole === ROLES.SCIENTIST ? (
                    <Shield size={18} className="text-cyan-400" />
                  ) : (
                    <Info size={18} className="text-gray-400" />
                  )}
                  
                  <div className="text-sm capitalize" style={{ color: GENOMIC_THEME.text.secondary }}>
                    {userRole}
                  </div>
                </div>
              </div>
              
              {/* Settings Controls */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Interface Settings</h3>
                
                <div className="p-3 rounded-lg flex items-center justify-between"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 size={18} className="text-cyan-400" />
                    ) : (
                      <VolumeX size={18} className="text-gray-500" />
                    )}
                    <span className="text-sm" style={{ color: GENOMIC_THEME.text.secondary }}>
                      Interface Sounds
                    </span>
                  </div>
                  
                  <button 
                    onClick={handleToggleSound}
                    className={`w-12 h-6 rounded-full flex items-center ${soundEnabled ? 'bg-cyan-500 justify-end' : 'bg-gray-700 justify-start'}`}
                  >
                    <div className={`w-5 h-5 rounded-full ${soundEnabled ? 'bg-white' : 'bg-gray-400'} shadow-md mx-0.5`}></div>
                  </button>
                </div>
              </div>
              
              {/* Audit Link */}
              <div className="pt-2">
                <a 
                  href="https://example.com/audit-report" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm hover:underline"
                  style={{ color: GENOMIC_THEME.primary }}
                >
                  <ShieldCheck size={14} />
                  <span>View Security Audit Report</span>
                </a>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-800 text-xs text-center" style={{ color: GENOMIC_THEME.text.muted }}>
              ChainSight v1.0.0 • © 2023 BioNova Labs
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 