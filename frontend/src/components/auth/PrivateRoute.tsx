'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/lib/hooks/useAuth';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface PrivateRouteProps {
  children: React.ReactNode;
}

// Loading spinner component
const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm z-50">
    <div className="relative w-20 h-20 mx-auto">
      <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
      <div className="absolute inset-4 rounded-full border-t-2 border-l-2 border-cyan-400 animate-spin-slow"></div>
    </div>
    <p className="text-indigo-300 mt-20">Loading...</p>
  </div>
);

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're done loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      
      // Get the current path to redirect back after login
      const currentPath = window.location.pathname;
      const redirectParam = encodeURIComponent(currentPath);
      
      // Redirect to login with the redirect parameter
      router.push(`/login?redirect=${redirectParam}`);
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen text="Verifying authentication..." />;
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
}

// HOC to wrap components that need authentication
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const WithAuth: React.FC<P> = (props) => (
    <PrivateRoute>
      <Component {...props} />
    </PrivateRoute>
  );

  // Set display name for better debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithAuth.displayName = `withAuth(${displayName})`;

  return WithAuth;
}; 