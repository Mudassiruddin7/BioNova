'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, ArrowLeft, RefreshCcw } from 'lucide-react';
import ParticleBackground from '@/components/landing/ParticleBackground';
import { authAPI } from '@/lib/api'; // Import the API directly

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail } = useAuth();
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  // Function to verify email that can be called multiple times
  const attemptVerification = async (verificationToken: string) => {
    console.log('Starting verification attempt...');
    setIsRetrying(true);
    
    try {
      console.log(`Attempting to verify with token: ${verificationToken.substring(0, 6)}...`);
      
      // Try first with the hook
      let success = false;
      try {
        console.log('Trying verification through auth hook...');
        success = await verifyEmail(verificationToken);
      } catch (hookErr) {
        console.error('Hook verification failed:', hookErr);
        
        // If hook fails, try direct API call as fallback
        try {
          console.log('Trying direct API call as fallback...');
          await authAPI.verifyEmail(verificationToken);
          success = true;
        } catch (apiErr: any) {
          console.error('API verification failed:', apiErr);
          throw apiErr;
        }
      }
      
      if (success) {
        console.log('Email verification successful!');
        setVerificationStatus('success');
      } else {
        console.error('Both verification methods returned false');
        setError('Failed to verify your email. The token may be invalid or expired.');
        setVerificationStatus('error');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      
      // Log more details about the error
      if (err.response) {
        console.error('Error response:', {
          status: err.response.status,
          data: err.response.data
        });
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred during verification';
      setError(errorMessage);
      setVerificationStatus('error');
    } finally {
      setIsRetrying(false);
    }
  };
  
  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        // Log the full URL for debugging
        if (typeof window !== 'undefined') {
          console.log('Verification page URL:', window.location.href);
        }
        
        const verificationToken = searchParams?.get('token');
        setToken(verificationToken);
        
        console.log('Email verification process started', { 
          hasToken: !!verificationToken, 
          params: Array.from(searchParams?.entries() || [])
        });
        
        if (!verificationToken) {
          console.error('No verification token found in URL');
          setError('Verification token is missing. Please check the link in your email.');
          setVerificationStatus('error');
          return;
        }
        
        console.log('Attempting to verify email with token', { 
          tokenLength: verificationToken.length,
          tokenPreview: `${verificationToken.substring(0, 8)}...${verificationToken.substring(verificationToken.length - 8)}`
        });
        
        await attemptVerification(verificationToken);
      } catch (err: any) {
        console.error('Verification setup error:', err);
        setError('Could not process verification. Please try again.');
        setVerificationStatus('error');
      }
    };
    
    verifyEmailToken();
  }, [searchParams]);
  
  const handleRetry = async () => {
    if (!token) {
      setError('No token available for retry. Please request a new verification email.');
      return;
    }
    
    setVerificationStatus('loading');
    await attemptVerification(token);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-indigo-950 flex items-center justify-center p-4 overflow-hidden">
      <ParticleBackground />
      
      <div className="relative z-10 max-w-md w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400">
              BioNova
            </span>
          </h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-300"
          >
            Email Verification
          </motion.p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="backdrop-blur-lg bg-gray-900/30 p-8 rounded-2xl border border-indigo-500/20 shadow-xl">
            <div className="text-center">
              {verificationStatus === 'loading' && (
                <div className="py-8">
                  <Loader2 className="h-16 w-16 text-indigo-400 mx-auto animate-spin mb-4" />
                  <h2 className="text-xl font-medium text-white mb-2">Verifying Your Email</h2>
                  <p className="text-gray-400">Please wait while we verify your email address...</p>
                </div>
              )}
              
              {verificationStatus === 'success' && (
                <div className="py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-medium text-white mb-2">Email Verified!</h2>
                  <p className="text-gray-400 mb-6">Your email has been successfully verified. You can now log in to your account.</p>
                  <Button 
                    onClick={() => router.push('/login')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Log In Now
                  </Button>
                </div>
              )}
              
              {verificationStatus === 'error' && (
                <div className="py-8">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-medium text-white mb-2">Verification Failed</h2>
                  <p className="text-gray-400 mb-1">{error || 'There was a problem verifying your email.'}</p>
                  <p className="text-gray-500 text-sm mb-6">
                    If you're still having trouble, try requesting a new verification email.
                  </p>
                  <div className="flex flex-col space-y-3">
                    <Button 
                      onClick={handleRetry}
                      disabled={isRetrying}
                      className="bg-amber-600 hover:bg-amber-700 text-white mb-2"
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      {isRetrying ? 'Retrying...' : 'Retry Verification'}
                    </Button>
                    <Button 
                      onClick={() => router.push('/login')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 