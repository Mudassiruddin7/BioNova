'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ANIMATIONS } from '@/lib/constants/designTokens';
import { BackgroundParticles } from './BackgroundParticles';
import { HelixFlow } from './HelixFlow';
import { SettingsButton } from './SettingsButton';
import WalletConnector from './WalletConnector';
import { Button } from '@/components/ui/button';
import { GenomicRecord } from '@/lib/stores/chainSightStore';
import { GenomicDashboard } from '@/components/chainSight/genomic/Dashboard';
import { TransactionHistory } from './TransactionHistory';
import { useChainSightStore } from '@/lib/stores/chainSightStore';
import { useAuthState, authEvents } from '@/lib/hooks/useAuth';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      damping: 12,
      stiffness: 100
    }
  }
};

export default function ChainSightWrapper({ children }: { children?: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const { wallet } = useChainSightStore();
  
  // Key state to force refresh of child components
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAuthenticated, userType, isLoading } = useAuthState();
  
  // Only run on client side
  useEffect(() => {
    setIsClient(true);
    
    // Subscribe to auth events to force refresh of components
    const unsubscribe = authEvents.subscribe((event: string, data?: any) => {
      if (event === 'auth_state_changed' || event === 'refresh_requested') {
        console.log(`ChainSight: ${event} event received`, data);
        
        // If explicitly logged out, update UI immediately
        if (data && data.isAuthenticated === false) {
          console.log('User logged out - updating ChainSight UI');
          setRefreshKey(prev => prev + 1);
          return;
        }
        
        // Check auth state from localStorage/cookies
        const token = localStorage.getItem('auth_token');
        const guestId = localStorage.getItem('guestId');
        const isGuestActive = localStorage.getItem('isGuestSessionActive') === 'true';
        
        // Only refresh if there's a state mismatch to avoid unnecessary rerenders
        const localAuthState = !!token || (!!guestId && isGuestActive);
        if (localAuthState !== isAuthenticated) {
          console.log('ChainSight refresh with auth state:', {
            hasToken: !!token,
            isGuestSession: !!guestId && isGuestActive,
            event,
            data
          });
          
          // Increment key to force re-render of children
          setRefreshKey(prev => prev + 1);
        }
      }
    });
    
    // Check auth state on mount - but limit frequency of checks
    let checkCount = 0;
    const checkAuthInterval = setInterval(() => {
      if (document.hidden) return; // Don't check if tab is not visible
      
      // Gradually reduce check frequency
      checkCount++;
      if (checkCount > 10 && checkCount % 3 !== 0) return; // After 10 checks, only check every 3rd time
      if (checkCount > 30 && checkCount % 5 !== 0) return; // After 30 checks, only check every 5th time
      
      // Check if user is logged in based on local storage values
      const token = localStorage.getItem('auth_token');
      const guestId = localStorage.getItem('guestId');
      const isGuestActive = localStorage.getItem('isGuestSessionActive') === 'true';
      
      // If local auth state doesn't match component state, force refresh
      const localAuthState = !!token || (!!guestId && isGuestActive);
      if (localAuthState !== isAuthenticated) {
        console.log('Auth state mismatch detected - refreshing UI');
        // Force rerender by updating key
        setRefreshKey(prev => prev + 1);
      }
    }, 3000);
    
    return () => {
      unsubscribe();
      clearInterval(checkAuthInterval);
    };
  }, [isAuthenticated]); // Add isAuthenticated as dependency so the effect reruns when it changes

  // On mount - check container size and set global scaling if needed
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        // Check if we need to use special UI adjustments for small screens
        const width = containerRef.current.offsetWidth;
      }
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  // Sample empty records for HelixFlow with explicit type
  const emptyRecords: GenomicRecord[] = [];

  // Mock handler for node clicks
  const handleNodeClick = (recordId: string) => {
    console.log('Node clicked:', recordId);
  };

  // Check wallet connection from the store which doesn't rely on Wagmi hooks directly
  const isWalletConnected = wallet.isConnected && wallet.address;
  console.log('isWalletConnected chainSight wrapper', isWalletConnected);
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-black to-gray-900" ref={containerRef}>
      {/* Background animations */}isWalletConnected
      <BackgroundParticles />
      
      {/* Use HelixFlow with required props */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <HelixFlow records={emptyRecords} onNodeClick={handleNodeClick} />
      </div>
      
      {/* Settings button with enhanced positioning */}
      <div className="absolute top-4 right-4 z-20">
        <SettingsButton />
      </div>
      
      <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-indigo-900/50 backdrop-blur-sm rounded-md border border-indigo-500/30 shadow-md">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          <span className="text-sm font-medium text-white">
            {isAuthenticated ? 'Authenticated: Yes' : isLoading ? 'Checking auth...' : 'Authenticated: No'}
            {userType && <span className="ml-1 text-indigo-200">- {userType}</span>}
          </span>
        </div>
      </div>
      
      {/* Main content container */}
      <div className="container mx-auto px-4 lg:px-8 py-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 80
          }}
          className="mb-16"
        >
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-center tracking-tight"
            style={{
              background: 'linear-gradient(to right, #4F46E5, #B16CEA, #00CCFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(79, 70, 229, 0.5)'
            }}
          >
            BioNova Genomic Platform
          </motion.h1>
          
          <motion.p 
            className="text-center text-white mt-6 max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            style={{
              textShadow: '0 0 20px rgba(79, 70, 229, 0.4)'
            }}
          >
            Secure your genomic research data on the blockchain with immutable storage 
            <br />and controlled access
          </motion.p>
        </motion.div>
        
        {/* Client-side placeholder that will be replaced on hydration */}
        {!isClient ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-center">
              <div className="h-8 w-32 bg-gray-700 rounded mx-auto mb-4"></div>
              <div className="h-4 w-64 bg-gray-700 rounded mx-auto"></div>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              key={`auth-container-${refreshKey}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-12"
            >
              {/* Always show the WalletConnector - with force refresh key */}
              <motion.div 
                variants={itemVariants}
                className="max-w-md mx-auto"
                key={`wallet-connector-${refreshKey}`}
              >
                <WalletConnector 
                  // Explicitly pass auth state to ensure component has latest values
                  forceAuthenticated={isAuthenticated}
                  forceUserType={userType || undefined}
                  forceAuthLoading={isLoading}
                />
              </motion.div>
              
              { /* Only show genomic tools when wallet is connected */}
              {isWalletConnected && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-12 mt-8"
                >
                  {/* Genomic Dashboard */}
                  <motion.div variants={itemVariants}>
                    <GenomicDashboard />
                  </motion.div>
                  
                  {/* Show Transaction History only if no children are provided */}
                  {!children && (
                    <motion.div variants={itemVariants} className="mt-8">
                      <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <span className="mr-2 h-1 w-6 bg-indigo-500 rounded-full"></span>
                        Transaction History
                        <span className="ml-2 h-1 w-6 bg-indigo-500 rounded-full"></span>
                      </h2>
                      <TransactionHistory showFilters={true} />
                    </motion.div>
                  )}
                  
                  {!children && (
                    <motion.div 
                      variants={itemVariants}
                      className="flex justify-center mt-12"
                    >
                      <Button 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-2 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-indigo-500/30"
                        onClick={() => {
                          window.location.href = "/dashboard";
                        }}
                      >
                        Go to Dashboard
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
              
              {/* Render children if provided */}
              {children && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="mt-8"
                >
                  {children}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
} 