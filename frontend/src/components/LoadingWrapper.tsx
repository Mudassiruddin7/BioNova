'use client';

import React, { useState, useEffect } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface LoadingWrapperProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  minLoadTime?: number; // Minimum time to show loading screen in ms
}

/**
 * A wrapper component that displays a loading screen while content is loading.
 * Can be used to wrap any page or component.
 */
export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  minLoadTime = 0, // default to no minimum time
}) => {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading && !loadStartTime) {
      // Start of loading - record the time
      setLoadStartTime(Date.now());
      setShowLoading(true);
    } else if (!isLoading && loadStartTime) {
      // Loading finished - check if minimum time has elapsed
      const timeElapsed = Date.now() - loadStartTime;
      
      if (timeElapsed < minLoadTime) {
        // Wait for the minimum load time before hiding
        const remainingTime = minLoadTime - timeElapsed;
        const timer = setTimeout(() => {
          setShowLoading(false);
          setLoadStartTime(null);
        }, remainingTime);
        
        return () => clearTimeout(timer);
      } else {
        // Minimum time already elapsed, hide immediately
        setShowLoading(false);
        setLoadStartTime(null);
      }
    }
  }, [isLoading, loadStartTime, minLoadTime]);

  return (
    <>
      {showLoading && <LoadingScreen text={loadingText} />}
      {children}
    </>
  );
};

/**
 * HOC to wrap any component with the LoadingWrapper
 */
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<LoadingWrapperProps, 'children'>
) {
  const WithLoading = (props: P & { isLoading?: boolean; loadingText?: string }) => {
    const { isLoading, loadingText, ...componentProps } = props;
    
    return (
      <LoadingWrapper 
        isLoading={isLoading} 
        loadingText={loadingText || options?.loadingText}
        minLoadTime={options?.minLoadTime}
      >
        <Component {...componentProps as P} />
      </LoadingWrapper>
    );
  };
  
  // Set display name for better debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithLoading.displayName = `withLoading(${displayName})`;
  
  return WithLoading;
}

export default LoadingWrapper; 