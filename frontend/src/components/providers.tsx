'use client';

import { ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { getDefaultWallets, RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { http } from 'viem';
import MousePositionProvider from '@/components/landing/MousePositionProvider';
import { useWalletInit } from '@/providers';
import { AuthProvider } from '@/lib/contexts/AuthProvider';
import Synapse from '@/components/synapse/Synapse';

// This providers file is deprecated and will be removed in a future update.
// It's being maintained for backward compatibility.
// Please use the main providers.tsx file in the src directory.

export function Providers({ children }: { children: ReactNode }) {
  const isInitialized = useWalletInit();
  const [isClient, setIsClient] = useState(false);

  // Only initialize on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // If WalletConnect is already initialized or we're on the server, just render children with MousePositionProvider
  if (isInitialized || !isClient) {
    return (
      <MousePositionProvider>
        <AuthProvider>
          {children}
          {isClient && <Synapse />}
        </AuthProvider>
      </MousePositionProvider>
    );
  }

  // Set up chains array for use (previously was causing type errors)
  const chainsArray = [baseSepolia, base];

  // Set up connectors - fixed type error by removing chains parameter
  const { connectors } = getDefaultWallets({
    appName: 'BioNova',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id',
  });

  // Create config with proper chain typing
  const wagmiConfig = createConfig({
    chains: chainsArray,
    transports: {
      [baseSepolia.id]: http(),
      [base.id]: http(),
    },
    connectors,
  });

  // Create a client
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={baseSepolia}
          theme={lightTheme({
            accentColor: '#4f46e5', // indigo-600
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
          })}
        >
          <MousePositionProvider>
            <AuthProvider>
              {children}
              <Synapse />
            </AuthProvider>
          </MousePositionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 