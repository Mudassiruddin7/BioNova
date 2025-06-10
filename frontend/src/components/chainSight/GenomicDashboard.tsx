'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useWalletState } from '@/lib/hooks/useWalletState';
import { RegisterSample } from './genomic/RegisterSample';
import { RegisterExperiment } from './genomic/RegisterExperiment';
import { AccessControl } from './genomic/AccessControl';
import { WorkflowManager } from './genomic/WorkflowManager';
import { IPRights } from './genomic/IPRights';
import { Info, AlertTriangle, LogOut, Shield, Database, Activity, GitBranch, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Tab = 'samples' | 'experiments' | 'access' | 'workflow' | 'ip';

export const GenomicDashboard = () => {
  const router = useRouter();
  const { userAddress, disconnectWallet, walletType, userRole } = useWalletState();
  const [activeTab, setActiveTab] = useState<Tab>('samples');
  const [shortAddress, setShortAddress] = useState('');
  
  // Update shortAddress when userAddress changes
  useEffect(() => {
    if (userAddress) {
      setShortAddress(`${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`);
    } else {
      setShortAddress('');
    }
  }, [userAddress]);
  
  // Handle disconnect with router refresh
  const handleDisconnect = () => {
    disconnectWallet();
    // Force a refresh to update the UI state
    router.refresh();
  };
  
  // Mouse animation values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.6
      } 
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 10 }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'samples':
        return <RegisterSample />;
      case 'experiments':
        return <RegisterExperiment />;
      case 'access':
        return <AccessControl />;
      case 'workflow':
        return <WorkflowManager />;
      case 'ip':
        return <IPRights />;
      default:
        return <RegisterSample />;
    }
  };
  
  // Tab definitions with icons
  const tabs = [
    { id: 'samples', label: 'Samples', icon: Database },
    { id: 'experiments', label: 'Experiments', icon: Activity },
    { id: 'access', label: 'Access Control', icon: Shield },
    { id: 'workflow', label: 'Workflow', icon: GitBranch },
    { id: 'ip', label: 'IP Rights', icon: Award },
  ];

  return (
    <motion.div 
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onMouseMove={handleMouseMove}
    >
      {/* Introduction Section */}
      <motion.div
        variants={itemVariants}
        className="p-6 mb-8 rounded-xl relative overflow-hidden"
        style={{
          background: 'rgba(6, 6, 32, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(79, 70, 229, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Animated gradient background */}
        <motion.div 
          className="absolute inset-0 -z-10 opacity-40"
          animate={{ 
            background: [
              'radial-gradient(circle at var(--x) var(--y), rgba(79, 70, 229, 0.15) 0%, rgba(6, 6, 32, 0) 50%)',
              'radial-gradient(circle at var(--x) var(--y), rgba(139, 92, 246, 0.15) 0%, rgba(6, 6, 32, 0) 50%)',
              'radial-gradient(circle at var(--x) var(--y), rgba(79, 70, 229, 0.15) 0%, rgba(6, 6, 32, 0) 50%)'
            ],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{ 
            '--x': useTransform(mouseX, val => `${val}px`),
            '--y': useTransform(mouseY, val => `${val}px`),
          } as any}
        />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <motion.h1 
              className="text-2xl md:text-3xl font-bold mb-2"
              style={{
                background: 'linear-gradient(to right, #4F46E5, #B16CEA, #00CCFF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundSize: '200% 100%'
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'linear'
              }}
            >
              Genomic Data on the Blockchain
            </motion.h1>
            <p className="text-sm text-gray-300">
              Your genomic research data is securely stored on the Base blockchain, providing immutable, permanent records.
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(0, 204, 255, 0.2)' }}
              className="px-4 py-2 rounded-lg text-sm bg-black/40 border border-indigo-500/30"
            >
              <div className="flex items-center">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">Connected as:</span>
                  <span className="font-mono text-indigo-400">{shortAddress}</span>
                </div>
                <div className="ml-3 w-2 h-2 rounded-full bg-green-500 ring-2 ring-green-500/30 animate-pulse"></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Role: {userRole}</div>
            </motion.div>
            
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(220, 38, 38, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 transition-all border border-red-500/20"
              onClick={handleDisconnect}
            >
              <LogOut size={16} />
              <span className="text-sm">Disconnect</span>
            </motion.button>
          </div>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          variants={containerVariants}
        >
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(0, 204, 255, 0.3)' }}
            className="p-4 rounded-lg bg-gradient-to-br from-black/50 to-cyan-950/30 border border-cyan-600/30 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-cyan-900/50">
                <Database size={18} className="text-cyan-400" />
              </div>
              <h3 className="text-sm font-medium text-cyan-400">Immutability</h3>
            </div>
            <p className="text-xs text-gray-300">
              Once recorded, data cannot be altered or deleted, ensuring research integrity.
            </p>
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(147, 51, 234, 0.3)' }}
            className="p-4 rounded-lg bg-gradient-to-br from-black/50 to-purple-950/30 border border-purple-600/30 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-purple-900/50">
                <Shield size={18} className="text-purple-400" />
              </div>
              <h3 className="text-sm font-medium text-purple-400">Security</h3>
            </div>
            <p className="text-xs text-gray-300">
              Cryptographic security protects data authenticity and researcher attribution.
            </p>
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' }}
            className="p-4 rounded-lg bg-gradient-to-br from-black/50 to-blue-950/30 border border-blue-600/30 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-blue-900/50">
                <Activity size={18} className="text-blue-400" />
              </div>
              <h3 className="text-sm font-medium text-blue-400">Traceability</h3>
            </div>
            <p className="text-xs text-gray-300">
              Full audit trail of all genomic research activities with timestamps.
            </p>
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}
            className="p-4 rounded-lg bg-gradient-to-br from-black/50 to-emerald-950/30 border border-emerald-600/30 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-emerald-900/50">
                <Award size={18} className="text-emerald-400" />
              </div>
              <h3 className="text-sm font-medium text-emerald-400">Collaboration</h3>
            </div>
            <p className="text-xs text-gray-300">
              Access controls allow secure collaboration while maintaining data ownership.
            </p>
          </motion.div>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          whileHover={{ boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)' }}
          className="p-4 bg-amber-950/20 rounded-lg border border-amber-700/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <h3 className="text-sm font-medium text-amber-400">Network Information</h3>
          </div>
          <p className="text-xs text-gray-300 mb-1">
            This platform stores data on the <span className="text-amber-400 font-medium">Base Sepolia Testnet</span> (Chain ID: 84532). Your wallet may prompt you to switch networks when submitting data.
          </p>
          <p className="text-xs text-gray-300 flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-400" />
            <span>Need testnet ETH? Get it from the <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">Base Sepolia Faucet</a></span>
          </p>
        </motion.div>
      </motion.div>
      
      {/* CRISPR Gene Editing Dashboard */}
      <motion.div 
        variants={itemVariants}
        className="mb-8"
      >
        <motion.h2 
          className="text-3xl font-bold text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 50, damping: 10, delay: 0.3 }}
        >
          CRISPR Gene Editing Dashboard
        </motion.h2>
        
        {/* Tabs */}
        <motion.div 
          className="flex overflow-x-auto mb-6"
          variants={itemVariants}
        >
          <div 
            className="flex w-full bg-gray-900/50 rounded-lg p-1.5"
            style={{
              border: '1px solid rgba(79, 70, 229, 0.3)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              
              return (
                <motion.button
                  key={tab.id}
                  className={`relative flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white hover:bg-indigo-900/20'
                  }`}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  whileHover={{ scale: isActive ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-600 to-indigo-700 -z-10"
                      layoutId="activeTabBackground"
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    />
                  )}
                  <Icon size={16} className={isActive ? 'text-white' : 'text-indigo-400'} />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
        
        {/* Tab Content */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-xl relative overflow-hidden"
          style={{
            background: 'rgba(6, 6, 32, 0.8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(79, 70, 229, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          <motion.div 
            className="absolute inset-0 -z-10 opacity-20"
            animate={{ 
              background: [
                'radial-gradient(circle at 30% 30%, rgba(79, 70, 229, 0.4) 0%, rgba(6, 6, 32, 0) 50%)',
                'radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.4) 0%, rgba(6, 6, 32, 0) 50%)',
                'radial-gradient(circle at 30% 30%, rgba(79, 70, 229, 0.4) 0%, rgba(6, 6, 32, 0) 50%)'
              ],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}; 