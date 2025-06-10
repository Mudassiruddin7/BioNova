'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Info, AlertTriangle, ChevronDown, ChevronUp, Zap, ExternalLink, Check, Wallet, LogIn, Copy, CopyIcon } from 'lucide-react';
import { DNA_COLORS } from '@/lib/constants/designTokens';
import { getWalletClient, getAccount, signMessage, connect, disconnect } from 'wagmi/actions';
import { useWalletAccount } from '@/lib/hooks/use-wallet-account';
import { useChainSightStore } from '@/lib/stores/chainSightStore';
import { useChainId, useAccount, useBalance, useDisconnect } from 'wagmi';
import { PersistentConnectButton } from './PersistentConnectButton';
import { useAuthState, useAuthDispatch, authEvents } from '@/lib/hooks/useAuth';
import { authAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOutIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatEther } from 'ethers';
import { isEmpty } from 'lodash';
import { WalletState } from '@/lib/stores/chainSightStore';
import { 
  getGuestId, 
  loadGuestData, 
  updateGuestData, 
  isGuestSessionActive 
} from '@/lib/utils/guestStorage';
import { useConnect } from 'wagmi';
import { Badge } from "@/components/ui/badge";
import lodash from 'lodash';
import { BaseWalletConnector } from '@/components/BaseWalletConnector';

// Component animations
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 15, stiffness: 80 } }
};

const sectionVariants = {
  expanded: { height: 'auto', opacity: 1 },
  collapsed: { height: 0, opacity: 0 }
};

const cardVariants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } }
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.98, transition: { duration: 0.1 } }
};

interface WalletConnectorProps {
  containerClassName?: string;
  forceAuthenticated?: boolean;
  forceUserType?: string;
  forceAuthLoading?: boolean;
}

const shortenAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const WalletConnector: React.FC<WalletConnectorProps> = ({
  containerClassName = "",
  forceAuthenticated,
  forceUserType,
  forceAuthLoading
}) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { setWalletConnected, wallet } = useChainSightStore();
  const { toast } = useToast();
  
  // State for 3D card effect and expandable sections
  const [isConnectReasonExpanded, setIsConnectReasonExpanded] = useState(false);
  const [isSecurityInfoExpanded, setIsSecurityInfoExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [0, 300], [5, -5]);
  const rotateY = useTransform(mouseX, [0, 300], [-5, 5]);
  
  // Add mounting state for client-side rendering
  const [isMounted, setIsMounted] = useState(false);
  
  // State for guest wallet
  const [guestWalletAddress, setGuestWalletAddress] = useState<string | undefined>(undefined);
  const [isGuestWalletConnected, setIsGuestWalletConnected] = useState(false);
  
  // Get auth state through props if available, otherwise use the hook
  const hookAuthState = useAuthState();
  
  // Prioritize forced props over hook values to ensure component updates correctly
  const isAuthenticated = forceAuthenticated !== undefined ? forceAuthenticated : hookAuthState.isAuthenticated;
  const userType = forceUserType !== undefined ? forceUserType : hookAuthState.userType;
  const isAuthLoading = forceAuthLoading !== undefined ? forceAuthLoading : hookAuthState.isLoading;
  const isGuest = userType === 'guest';
  
  const authDispatch = useAuthDispatch();
  
  // Use a unique key based on authentication state for animation purposes
  const authStateKey = `${isAuthenticated}-${userType}-${isConnected}-${address}`;
  
  // Debug authentication state
  useEffect(() => {
    if (isMounted) {
      console.log('WalletConnector authentication state:', { 
        isAuthenticated, 
        userType, 
        isLoading: isAuthLoading,
        isConnected,
        address,
        forceProps: { forceAuthenticated, forceUserType, forceAuthLoading },
        authStateKey
      });
    }
  }, [isAuthenticated, userType, isAuthLoading, isConnected, address, isMounted, forceAuthenticated, forceUserType, forceAuthLoading, authStateKey]);
  
  // Handle mounting to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
    
    // Subscribe to auth events to update state when auth changes
    const unsubscribe = authEvents.subscribe((event: string, data?: any) => {
      if (event === 'auth_state_changed') {
        console.log('WalletConnector: Auth state changed event received', data);
        
        // If logout event, update component immediately
        if (data && data.isAuthenticated === false) {
          console.log('WalletConnector: Logout event detected');
          // No need to trigger another event here - just respond to the existing one
        } else {
          // Only check for mismatches occasionally to prevent loops
          // We rely on debouncing in the auth events system, but add this check as an extra safeguard
          const shouldCheckState = Math.random() < 0.2; // Only check ~20% of the time
          
          if (shouldCheckState) {
            // Instead of manipulating state directly, force a re-check of auth state
            // This ensures we have the latest state from cookies/localStorage/API
            const api = authAPI as any;
            const token = localStorage.getItem('auth_token');
            if (token && api.setToken) {
              api.setToken(token);
            }
          
            // Check if user is in guest mode
            const guestId = getGuestId();
            const isGuestActive = isGuestSessionActive();
            
            // Check if our auth state matches local storage
            const localAuthState = !!token || (!!guestId && isGuestActive);
            
            if (localAuthState !== isAuthenticated) {
              console.log('WalletConnector: Auth state mismatch - refreshing');
              // Force refresh via refreshKey in parent component
              authEvents.emit('refresh_requested');
            }
          }
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]); // Add isAuthenticated as dependency to prevent stale closures
  
  // Load guest wallet data on mount
  useEffect(() => {
    if (!isMounted) return;
    
    if (isGuest) {
      const guestId = getGuestId();
      if (guestId && isGuestSessionActive()) {
        const guestData = loadGuestData(guestId);
        if (guestData.wallet?.isConnected) {
          setGuestWalletAddress(guestData.wallet.address);
          setIsGuestWalletConnected(true);
          setWalletConnected(true);
        }
      }
    }
  }, [isGuest, setWalletConnected, isMounted]);
  
  // Handle real wallet connection changes
  useEffect(() => {
    if (!isMounted) return;
    
    if (!isGuest && isConnected && address) {
      setWalletConnected(true);
    } else if (!isGuest) {
      setWalletConnected(isConnected);
    }
  }, [isConnected, address, setWalletConnected, isGuest, isMounted]);
  
  // When a real wallet connects, save it to guest data if in guest mode
  useEffect(() => {
    if (!isMounted) return;
    
    try {
      if (isGuest && isConnected && address) {
        const guestId = getGuestId();
        if (guestId) {
          // Create a proper wallet object with safe defaults
          const walletData = {
            address: address || '',
            isConnected: Boolean(isConnected),
            chainId: chainId || 0
          };
          
          updateGuestData(guestId, (currentData) => ({
            ...currentData || {},
            wallet: walletData
          }));
          
          setGuestWalletAddress(address);
          setIsGuestWalletConnected(true);
          setWalletConnected(true);
          
          // Notify about wallet connection status change
          authEvents.emit('auth_state_changed', { isAuthenticated, walletConnected: true });
        }
      }
    } catch (error) {
      console.error('Error saving guest wallet data:', error);
      toast.error("Failed to save wallet connection data");
    }
  }, [isGuest, isConnected, address, chainId, setWalletConnected, toast, isMounted, isAuthenticated]);
  
  const balanceResult = useBalance({
    address: address,
  });
  
  const nativeToken = balanceResult.data?.symbol || 'ETH';
  
  // Handle mouse move for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };
  
  // Function to navigate to login page
  const navigateToLogin = () => {
    window.location.href = '/login';
  };
  
  // Function to copy wallet address to clipboard
  const copyAddressToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address)
        .then(() => {
          toast.success("Address copied to clipboard!");
        })
        .catch(error => {
          console.error('Failed to copy address:', error);
          toast.error("Failed to copy address");
        });
    }
  };

  // Handle wallet disconnect
  const onDisconnect = () => {
    disconnect();
    setWalletConnected(false);
    
    // If guest, update local storage
    if (isGuest) {
      const guestId = getGuestId();
      if (guestId) {
        updateGuestData(guestId, (currentData) => ({
          ...currentData,
          wallet: {
            isConnected: false
          }
        }));
        setGuestWalletAddress(undefined);
        setIsGuestWalletConnected(false);
      }
    }
    
    // Notify about wallet disconnection
    authEvents.emit('auth_state_changed', { isAuthenticated, walletConnected: false });
  };

  // Helper to determine effective wallet address
  const getDisplayAddress = () => {
    if (isGuest) {
      return guestWalletAddress || address || '';
    }
    return address || '';
  };

  // Helper to determine if a wallet is effectively connected
  const isWalletEffectivelyConnected = () => {
    if (isGuest) {
      return isGuestWalletConnected || isConnected;
    }
    return isConnected;
  };

  wallet.isConnected = isWalletEffectivelyConnected();

  console.log('isWalletEffectivelyConnected', isWalletEffectivelyConnected());


  // Toggle expandable sections
  const toggleSection = (section: string) => {
    if (section === 'why') {
      setIsConnectReasonExpanded(!isConnectReasonExpanded);
      if (isSecurityInfoExpanded) setIsSecurityInfoExpanded(false);
    } else if (section === 'security') {
      setIsSecurityInfoExpanded(!isSecurityInfoExpanded);
      if (isConnectReasonExpanded) setIsConnectReasonExpanded(false);
    }
  };

  const { connectors } = useConnect();
  const recommendedWallets = React.useMemo(() => getRecommendedWallets(connectors), [connectors]);

  // If not mounted yet, show a placeholder to avoid hydration issues
  if (!isMounted) {
    return (
      <div className={cn(containerClassName)}>
        <div className="bg-muted/50 backdrop-blur-md border border-indigo-500/20 shadow-lg shadow-indigo-500/10 h-[146px] rounded-md animate-pulse"></div>
      </div>
    );
  }
  
  // If still loading auth state, show a loading placeholder
  if (isAuthLoading) {
    return (
      <div className={cn(containerClassName)}>
        <div className="bg-muted/50 backdrop-blur-md border border-indigo-500/20 shadow-lg shadow-indigo-500/10 h-[146px] rounded-md animate-pulse flex items-center justify-center">
          <div className="text-center">
            <div className="h-6 w-6 border-t-2 border-r-2 border-indigo-500 animate-spin rounded-full mx-auto"></div>
            <div className="text-xs text-indigo-300 mt-2">Loading wallet...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-3 md:p-6", containerClassName)}>
      <AnimatePresence mode="wait">
        {isAuthenticated ? (
      <motion.div
            ref={containerRef}
            key={`authenticated-3d-card-${authStateKey}`}
            className="max-w-md mx-auto bg-black/70 backdrop-blur-md border border-indigo-900/40 rounded-2xl overflow-hidden"
        style={{
              rotateX: rotateX, 
              rotateY: rotateY,
              transformPerspective: 1000,
              boxShadow: '0 25px 50px -12px rgba(79, 70, 229, 0.15)'
            }}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20 
            }}
            onMouseMove={handleMouseMove}
          >
            <div className="p-6 md:p-8">
              {/* Section Title */}
              <motion.div 
                variants={itemVariants}
                className="mb-6 flex items-center"
              >
                <Zap className="text-indigo-500 mr-2 h-5 w-5" />
                <h2 className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Connect to Base Network
                </h2>
              </motion.div>

              {/* Wallet Status - Show when connected */}
              {isWalletEffectivelyConnected() && getDisplayAddress() ? (
                <motion.div 
                  variants={itemVariants}
                  className="mb-6 p-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg border border-indigo-500/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                      </div>
                      <div>
                        <div className="text-green-400 font-medium">Wallet Connected</div>
                        <div className="text-xs text-gray-400">
                          Base {chainId === 84532 ? 'Sepolia' : ''} Network
                          {isGuest && <span className="ml-2 text-amber-400">(Guest)</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => copyAddressToClipboard()}
                        variant="ghost"
                        className="h-8 w-8 hover:bg-indigo-500/10"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={onDisconnect}
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 hover:bg-red-500/10"
                      >
                        <LogOutIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                      {shortenAddress(getDisplayAddress() as string)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                      Balance:{' '}
                      {isGuest ? (
                        <span className="ml-1 text-yellow-400">
                          Guest Mode
                        </span>
                      ) : balanceResult.isLoading ? (
                        <span className="ml-1 animate-pulse">Loading...</span>
                      ) : (
                        <span className="ml-1 font-semibold text-white">
                          {formatEther(balanceResult.data?.value || '0').substring(0, 6)} {nativeToken}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  variants={itemVariants}
                  className="mb-6"
                >
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-0.5 rounded-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all">
                    <div className="bg-gradient-to-br from-black/80 to-indigo-950/90 rounded-md p-4 flex flex-col items-center">
                      <span className="text-white font-medium mb-3 text-center">Connect your wallet to interact with the blockchain</span>
                      <div className="w-full relative">
                        <div className="absolute -inset-0.5 bg-indigo-500 rounded-lg opacity-20 blur-md animate-pulse"></div>
                        <div className="relative w-full">
                          <PersistentConnectButton />
                        </div>
                      </div>
                      <div className="flex items-center mt-3 text-xs text-indigo-300">
                        <Wallet className="w-3 h-3 mr-1" />
                        <span>Secure connection using Base Network</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Info Section: About Base Network */}
              <motion.div variants={itemVariants} className="mb-6">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0 mt-1">
                    <Info className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-indigo-300 text-sm font-medium mb-2">About Base Network</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Base is a secure, low-cost, developer-friendly Ethereum L2 built on Optimism's OP Stack. For this hackathon, we're using the <span className="text-indigo-300">Base Sepolia Testnet</span>.
                    </p>
                  </div>
                </div>
        </motion.div>
        
            {/* Why Connect */}
        <motion.div 
          variants={itemVariants}
                className="border border-indigo-500/20 rounded-lg overflow-hidden mb-4"
        >
          <button 
                onClick={() => toggleSection('why')}
                className="w-full p-4 flex justify-between items-center bg-indigo-900/20 hover:bg-indigo-900/30 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-indigo-400" />
                  <span className="font-medium text-white">Why Connect?</span>
            </div>
                  {isConnectReasonExpanded ? (
                  <ChevronUp className="w-5 h-5 text-indigo-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-indigo-400" />
                )}
          </button>
          
              <motion.div
                variants={sectionVariants}
                initial="collapsed"
                  animate={isConnectReasonExpanded ? "expanded" : "collapsed"}
                className="overflow-hidden"
              >
                <div className="p-4 bg-indigo-900/10">
                  <motion.p variants={itemVariants} className="text-gray-300 mb-3">
                    Connecting your wallet enables you to:
                  </motion.p>
                  <ul className="space-y-2">
                    <motion.li variants={itemVariants} className="flex items-start gap-2">
                      <div className="min-w-5 pt-0.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DNA_COLORS.primary }}></div>
                      </div>
                      <span className="text-gray-300">Authorize blockchain interactions with our smart contracts</span>
                    </motion.li>
                    <motion.li variants={itemVariants} className="flex items-start gap-2">
                      <div className="min-w-5 pt-0.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DNA_COLORS.secondary }}></div>
                          </div>
                      <span className="text-gray-300">Access secure genomic data management features</span>
                    </motion.li>
                    <motion.li variants={itemVariants} className="flex items-start gap-2">
                      <div className="min-w-5 pt-0.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DNA_COLORS.tertiary }}></div>
                        </div>
                      <span className="text-gray-300">Sign transactions and verify your identity</span>
                      </motion.li>
                  </ul>
                </div>
              </motion.div>
        </motion.div>
            
            {/* Security Info */}
        <motion.div 
          variants={itemVariants}
              className="border border-indigo-500/20 rounded-lg overflow-hidden"
        >
          <button 
                onClick={() => toggleSection('security')}
                className="w-full p-4 flex justify-between items-center bg-indigo-900/20 hover:bg-indigo-900/30 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span className="font-medium text-white">Security Information</span>
            </div>
                  {isSecurityInfoExpanded ? (
                  <ChevronUp className="w-5 h-5 text-indigo-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-indigo-400" />
                )}
          </button>
          
              <motion.div
                variants={sectionVariants}
                initial="collapsed"
                  animate={isSecurityInfoExpanded ? "expanded" : "collapsed"}
                className="overflow-hidden"
              >
                <div className="p-4 bg-indigo-900/10">
                  <motion.p variants={itemVariants} className="text-gray-300 mb-3">
                    When connecting your wallet, we:
                  </motion.p>
                  <motion.ul variants={itemVariants} className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Only request read access to your public address</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Request approval for each transaction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✗</span>
                      <span>Never access your private keys</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✗</span>
                      <span>Never auto-authorize transactions</span>
                    </li>
                  </motion.ul>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
        ) : (
          <motion.div
            key={`unauthenticated-${authStateKey}`}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card className="bg-black/70 backdrop-blur-md border border-indigo-900/40 shadow-lg shadow-indigo-500/10 max-w-md mx-auto">
              <CardHeader className="pb-2 border-b border-indigo-500/20">
                <CardTitle className="text-base font-medium flex items-center text-white">
                  <LogIn className="h-5 w-5 mr-2 text-indigo-400" />
                  Authentication Required
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-white mb-4 font-medium">
                  Please sign in or continue as guest to connect your wallet
                </p>
                <Button
                  variant="default"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-5 text-base shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                  onClick={navigateToLogin}
                >
                  Sign In or Continue as Guest
                </Button>
              </CardContent>
            </Card>
      </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 

const getRecommendedWallets = (connectors: any) => {
  if (!connectors || connectors.length === 0) return [];
  
  return Object.values(connectors || {})
    .filter((connector: any) => connector.id !== 'injected' && connector.ready)
    .sort((a: any, b: any) => {
      if (a.id === 'metaMask') return -1;
      if (b.id === 'metaMask') return 1;
      return 0;
    });
};

export default WalletConnector; 