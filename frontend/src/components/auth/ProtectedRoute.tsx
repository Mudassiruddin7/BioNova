'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component that redirects unauthenticated users to the login page.
 * Wrap any route that requires authentication with this component.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    // Only redirect after auth has been checked
    if (isInitialized && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login page');
      router.push('/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // If still initializing auth, show nothing (or could show a loading spinner)
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If not authenticated, don't render children while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render the children
  return <>{children}</>;
} 