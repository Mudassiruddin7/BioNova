'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/contexts/AuthProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

// Create a context to track if Wallet has been initialized
const WalletInitContext = createContext(false);
export const useWalletInit = () => useContext(WalletInitContext);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '356405303441-ge8ghhld339vnmm627o414b6fa0aiger.apps.googleusercontent.com';

// Log Google client ID (truncated for security)
if (typeof window !== 'undefined') {
  // Only log on client side
  const truncatedClientId = googleClientId ? 
    `${googleClientId.substring(0, 8)}...${googleClientId.substring(googleClientId.length - 6)}` : 
    'not found';
  
  console.log(`Google OAuth Provider initializing with client ID: ${truncatedClientId}`);
  
  // Validate client ID format (should be in format: numbers-letters.apps.googleusercontent.com)
  const isValidClientIdFormat = /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(googleClientId);
  if (!isValidClientIdFormat) {
    console.warn('Google Client ID may be invalid. Expected format: NUMBERS-ALPHANUMERIC.apps.googleusercontent.com');
  }
}

// Function to get wagmi config for Base Onchain Kit
const getWagmiConfig = () => {
  return createConfig({
    chains: [baseSepolia],
    connectors: [
      coinbaseWallet({
        appName: 'BioNova Chain Explorer',
      }),
    ],
    ssr: true,
    transports: {
      [baseSepolia.id]: http('https://sepolia.base.org'),
    },
  });
};

export function Providers({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [wagmiConfig, setWagmiConfig] = useState<any>(null);

  // Only initialize on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
      // Initialize configuration on the client side
      try {
        const config = getWagmiConfig();
        setWagmiConfig(config);
      } catch (err) {
        console.error('Failed to initialize wallet configuration:', err);
      }
    }
  }, []);

  // Don't render wallet providers during SSR or while initializing
  if (!isClient || !wagmiConfig) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>{children}</AuthProvider>
      </GoogleOAuthProvider>
    );
  }

  return (
    <WalletInitContext.Provider value={true}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
            <GoogleOAuthProvider clientId={googleClientId}>
              <AuthProvider>
                {children}
              </AuthProvider>
            </GoogleOAuthProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </WalletInitContext.Provider>
  );
} 