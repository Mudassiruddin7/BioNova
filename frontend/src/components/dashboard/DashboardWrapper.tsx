'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { baseSepolia } from 'viem/chains';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Import the client component with dynamic loading
const DashboardClient = dynamic(() => import('@/components/DashboardClient'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950/90 to-gray-900">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
          <div className="absolute inset-4 rounded-full border-t-2 border-l-2 border-cyan-400 animate-spin-slow"></div>
        </div>
        <p className="text-indigo-300">Loading dashboard...</p>
      </div>
    </div>
  )
});

export default function DashboardWrapper() {
  const [mounted, setMounted] = useState(false);

  // Only set up providers on the client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // For SSR, return null initially to avoid hydration errors
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950/90 to-gray-900">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
            <div className="absolute inset-4 rounded-full border-t-2 border-l-2 border-cyan-400 animate-spin-slow"></div>
          </div>
          <p className="text-indigo-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Get COINBASE PROJECT ID from environment or fallback
  const projectId = process.env.NEXT_PUBLIC_COINBASE_PROJECT_ID || 'c86f23da1913707381b31528a79c3e23';

  return (
    <OnchainKitProvider
      chain={baseSepolia}
      projectId={projectId}
      rpcUrl="https://sepolia.base.org"
      config={{
        appearance: {
          name: 'BioNova Dashboard',
          logo: '/logo.png',
          mode: 'auto',
          theme: 'default'
        },
        wallet: {
          display: 'modal'
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
          <DashboardClient />
      </QueryClientProvider>
    </OnchainKitProvider>
  );
} 