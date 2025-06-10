'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Mail, User, Lock, Eye, EyeOff, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { authEvents } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from "@/components/ui/separator";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import dynamic from 'next/dynamic';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info, CheckCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { ErrorBoundary } from 'react-error-boundary';
import LoadingScreen from '@/components/ui/LoadingScreen';

// Import the ParticleBackground component from the landing components
import ParticleBackground from '@/components/landing/ParticleBackground';

// Dynamic import for CustomCursor component
const CustomCursor = dynamic(() => import('@/components/landing/CustomCursor'), { ssr: false });

// Login form schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Register form schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Types
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Helper function to get user-friendly error message
const getUserFriendlyErrorMessage = (error: string): { message: string; title: string; isVerificationError?: boolean } => {
  // Authentication errors
  if (error.includes('Invalid credentials') || error.includes('password') || error.includes('Password')) {
    return {
      title: 'Authentication Failed',
      message: 'The email or password you entered is incorrect. Please try again.'
    };
  }
  
  // Email verification errors - check for various ways the backend might phrase this
  if (error.includes('verify') || error.includes('verification') || error.includes('verified') || error.includes('before logging in')) {
    return {
      title: 'Verification Required',
      message: 'Please verify your email address before logging in.',
      isVerificationError: true
    };
  }
  
  // User already exists errors
  if (error.includes('already exists') || error.includes('duplicate') || error.includes('E11000')) {
    return {
      title: 'Registration Failed',
      message: 'An account with this email already exists. Please sign in instead.',
      isVerificationError: true // This could be an unverified account, so allow resending
    };
  }

  // Wallet address errors
  if (error.includes('walletAddress')) {
    return {
      title: 'Registration Failed',
      message: 'There was an issue with your registration. Please try again or use a different method.'
    };
  }
  
  // Network errors
  if (error.includes('network') || error.includes('connect') || error.includes('timeout')) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.'
    };
  }
  
  // Server errors
  if (error.includes('500') || error.includes('server')) {
    return {
      title: 'Server Error',
      message: 'Our servers are experiencing issues. Please try again later.'
    };
  }
  
  // Default error
  return {
    title: 'Error',
    message: error || 'An unexpected error occurred. Please try again.'
  };
};

// DNA Helix animation component
const DNAHelix = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Create DNA strands
    const dnaStrands = 15;
    const basePairs = 10;
    const distance = 20;
    
    for (let i = 0; i < dnaStrands; i++) {
      for (let j = 0; j < 2; j++) {
        const strand = document.createElement('div');
        strand.className = `absolute h-2 w-2 rounded-full bg-indigo-${j === 0 ? '500' : '400'} opacity-${j === 0 ? '70' : '40'}`;
        strand.style.left = `${j === 0 ? 0 : distance}px`;
        strand.style.top = `${i * 15}px`;
        strand.style.transformOrigin = `${j === 0 ? distance/2 : -distance/2}px 0`;
        
        gsap.to(strand, {
          rotation: j === 0 ? 360 : -360,
          duration: 10 + Math.random() * 5,
          repeat: -1,
          ease: "linear"
        });
        
        container.appendChild(strand);
      }
    }
    
    return () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);
  
  return <div ref={containerRef} className="absolute h-full w-8 left-8 top-0 opacity-20"></div>;
};

// Client-side only floating DNA particles
const FloatingDNAParticles = () => {
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });

  useEffect(() => {
    // Set dimensions only after component is mounted
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Update dimensions if window is resized
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 rounded-full bg-indigo-500"
          initial={{ 
            x: Math.random() * dimensions.width, 
            y: Math.random() * dimensions.height,
            scale: 0.5 + Math.random() * 1
          }}
          animate={{ 
            y: [
              Math.random() * dimensions.height,
              Math.random() * dimensions.height
            ],
            x: [
              Math.random() * dimensions.width,
              Math.random() * dimensions.width
            ],
            scale: [0.5 + Math.random(), 1 + Math.random(), 0.5 + Math.random()]
          }}
          transition={{ 
            duration: 20 + Math.random() * 30,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

// Use dynamic import with ssr: false for the FloatingDNAParticles
const ClientOnlyFloatingDNA = dynamic(() => Promise.resolve(FloatingDNAParticles), { ssr: false });

// SearchParams component wrapped in suspense
function SearchParamsComponent({ 
  onError 
}: { 
  onError: (error: string | null) => void 
}) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check for error message in URL
    const errorMessage = searchParams?.get('error');
    if (errorMessage) {
      onError(decodeURIComponent(errorMessage));
    }
  }, [searchParams, onError]);
  
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, register: registerUser, loginWithGoogle, loginAsGuest, isAuthenticated, isInitialized, resendVerification } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'register'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Animation variables
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [5, -5]);
  const rotateY = useTransform(mouseX, [-300, 300], [-5, 5]);

  // Handle mouse move for card tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseX.set(x);
      mouseY.set(y);
    }
  };

  // React Hook Form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Redirect if already authenticated immediately after auth has initialized
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      // Always redirect to dashboard
      router.push('/dashboard');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Clear success messages when tab changes
  useEffect(() => {
    setSuccess(null);
  }, [activeTab]);

  // Handle resend verification email
  const handleResendVerification = async () => {
    // Get the email from the current active form
    const email = activeTab === 'email' 
      ? loginForm.getValues().email 
      : registerForm.getValues().email;
    
    if (!email) {
      setError('Please enter your email address first to resend verification');
      return;
    }
    
    try {
      setIsResendingVerification(true);
      await resendVerification(email);
      setError(null);
      setSuccess(`Verification email has been resent to ${email}. Please check your inbox and spam folder.`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setIsResendingVerification(false);
    }
  };

  // Handle email/password login
  const handleEmailLogin = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await login(values.email, values.password);
      
      // Immediately navigate to dashboard after login
      // The auth event system will handle updating components
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      await registerUser(values.email, values.password, values.name);
      setSuccess('Account created successfully! Please check your email for verification instructions.');
      // Reset the form
      registerForm.reset();
      // Switch to login tab after a delay
      setTimeout(() => {
        setActiveTab('email');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to register');
      console.error('Registration error:', err);
      
      // Automatically try to resend verification if email already exists
      if (err.message && err.message.includes('already exists')) {
        try {
          await resendVerification(values.email);
          setError(null);
          setSuccess(`This email is already registered. We've sent a verification email to ${values.email}. Please check your inbox and spam folder.`);
        } catch (resendError) {
          console.error('Failed to resend verification:', resendError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Google login response received:', { responseType: typeof credentialResponse });
      
      // Validate credential response
      if (!credentialResponse || !credentialResponse.credential) {
        throw new Error('Invalid Google credential response');
      }
      
      // Extract the ID token from the credential response
      const idToken = credentialResponse.credential;
      console.log('Google ID token received:', { tokenLength: idToken.length });
      
      let email, name;
      
      try {
        // Get user information from the decoded JWT using a safer approach
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decodedToken = JSON.parse(jsonPayload);
        console.log('Successfully decoded token payload:', { 
          hasEmail: !!decodedToken.email,
          hasName: !!decodedToken.name 
        });
        
        email = decodedToken.email;
        name = decodedToken.name;
        
        if (!email) {
          throw new Error('Email not found in Google token');
        }
      } catch (decodeError) {
        console.error('Failed to decode Google token:', decodeError);
        throw new Error('Could not process Google sign-in information');
      }
      
      // Call the loginWithGoogle function with the extracted information
      console.log('Calling loginWithGoogle with:', { email, name: name || '' });
      const response = await loginWithGoogle(idToken, email, name);
      console.log('Google login successful:', response);
      
      // Immediately navigate to dashboard after login
      // The auth event system will handle updating components
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Google login error details:', err);
      
      // Provide more helpful error messages based on the error
      let errorMessage = 'Failed to login with Google';
      
      if (err.response) {
        // Handle API response errors
        if (err.response.status === 400) {
          errorMessage = err.response.data?.message || 'Invalid Google authentication data';
        } else if (err.response.status === 401 || err.response.status === 403) {
          errorMessage = 'Authentication failed. You may not have permission to access this account.';
        } else if (err.response.status >= 500) {
          errorMessage = 'Server error while processing Google login. Please try again later.';
        }
      } else if (err.message) {
        // Use the error message directly if available
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Google login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle guest login
  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await loginAsGuest();
      
      // Immediately navigate to dashboard after login
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login as guest');
      console.error('Guest login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Animations for form elements
  const formAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.05 * i,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <>
      {/* Show loading screen when checking authentication or processing a request */}
      {(isLoading || (!isInitialized && !isAuthenticated)) && (
        <LoadingScreen 
          text={isLoading ? "Processing..." : "Checking authentication..."} 
        />
      )}
    
      <div className="flex min-h-screen relative overflow-hidden bg-gray-950 items-center justify-center">
        {/* Suspense boundary for search params */}
        <Suspense fallback={null}>
          <SearchParamsComponent onError={setError} />
        </Suspense>
        
        <ParticleBackground />
        <ClientOnlyFloatingDNA />
        <CustomCursor />
        
        {/* Left decorative column */}
        <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-b from-indigo-950/40 via-purple-900/30 to-indigo-950/40 opacity-50 hidden lg:block">
          <DNAHelix />
        </div>
        
        {/* Right decorative column */}
        <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-b from-indigo-950/40 via-purple-900/30 to-indigo-950/40 opacity-50 hidden lg:block">
          <DNAHelix />
        </div>

        {/* Main content - centered container */}
        <div className="flex flex-col items-center justify-center w-full max-w-md px-4 z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-bold mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400">
                BioNova
              </span>
            </h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-gray-300"
            >
              Sign in to access the AI-Powered Gene Intelligence
            </motion.p>
          </motion.div>

          <motion.div 
            ref={cardRef}
            style={{ 
              rotateX,
              rotateY,
              transformPerspective: 1200,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              mouseX.set(0);
              mouseY.set(0);
            }}
            className="backdrop-blur-lg bg-gray-900/30 p-8 rounded-2xl border border-indigo-500/20 shadow-xl w-full"
          >
            <Tabs 
              defaultValue="email" 
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as 'email' | 'register');
                setError(null);
                setSuccess(null);
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-8 bg-gray-800/50 border border-gray-700/30">
                <TabsTrigger 
                  value="email"
                  className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                >
                  <motion.div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </motion.div>
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                >
                  <motion.div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Register
                  </motion.div>
                </TabsTrigger>
              </TabsList>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <Alert variant="destructive" className="bg-red-900/30 border border-red-500/30 text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-red-200">
                      {getUserFriendlyErrorMessage(error).title}
                    </AlertTitle>
                    <AlertDescription className="text-red-200/80">
                      {getUserFriendlyErrorMessage(error).message}
                      
                      {/* Show resend verification button if it's a verification error */}
                      {getUserFriendlyErrorMessage(error).isVerificationError && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-4"
                        >
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleResendVerification}
                            disabled={isResendingVerification}
                            className="w-full bg-amber-600/30 hover:bg-amber-500/40 border border-amber-500/30 text-amber-100"
                          >
                            {isResendingVerification ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                              </>
                            ) : (
                              'Resend Verification Email'
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <Alert className="bg-green-900/30 border border-green-500/30 text-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle className="text-green-200">Success</AlertTitle>
                    <AlertDescription className="text-green-200/80">
                      {success}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <TabsContent value="email" className="mt-0">
                <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                  <motion.div 
                    className="space-y-2"
                    custom={1} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                  >
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                      <Input
                        id="email"
                        placeholder="your@email.com"
                        className="pl-10 bg-gray-800/50 border-gray-700 focus:border-indigo-500 text-white placeholder:text-gray-500"
                        {...loginForm.register('email')}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-red-400 text-sm">{loginForm.formState.errors.email.message}</p>
                    )}
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    custom={2} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                  >
                    <Label htmlFor="password" className="text-gray-300">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 bg-gray-800/50 border-gray-700 focus:border-indigo-500 text-white placeholder:text-gray-500 pr-10"
                        {...loginForm.register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-red-400 text-sm">{loginForm.formState.errors.password.message}</p>
                    )}
                  </motion.div>

                  <motion.div 
                    className="flex justify-end"
                    custom={3} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                  >
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto font-normal text-indigo-400 hover:text-indigo-300"
                    >
                      Forgot password?
                    </Button>
                  </motion.div>

                  <motion.div
                    custom={4} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                  >
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={isLoading}
                    >
                      <span className="mr-2">Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  
                  <motion.div 
                    className="mt-4 relative"
                    custom={5} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    custom={6} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                    className="mt-4"
                  >
                    <div className="w-full flex justify-center">
                      {/* Wrap Google login in try-catch and error boundary */}
                      {typeof window !== 'undefined' && (
                        <ErrorBoundary 
                          fallback={
                            <Button variant="outline" className="w-full bg-gray-800/50 border-gray-600 text-gray-300" disabled>
                              Google Sign-In Unavailable
                            </Button>
                          }
                          onError={(error) => {
                            console.error('Google Login ErrorBoundary caught error:', error);
                          }}
                        >
                          <Suspense fallback={
                            <Button variant="outline" className="w-full bg-gray-800/50 border-gray-600 text-gray-300" disabled>
                              Loading Google Sign-In...
                            </Button>
                          }>
                            {console.log('Rendering GoogleLogin component')}
                            <GoogleLogin
                              onSuccess={(response) => {
                                console.log('Google login success callback triggered', {
                                  hasCredential: !!response.credential,
                                  credentialLength: response.credential ? response.credential.length : 0
                                });
                                handleGoogleLogin(response);
                              }}
                              onError={(error) => {
                                console.error('Google login error callback triggered:', error);
                                setError('Google sign-in failed. Please try again or use another method.');
                              }}
                              theme="filled_black"
                              text="signin_with"
                              shape="pill"
                              locale="en"
                              useOneTap={false}
                              width={240}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    custom={7} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                    className="mt-4"
                  >
                    <div className="w-full flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-gray-800/30 border-indigo-500/50 hover:bg-indigo-600/20 text-gray-200"
                        onClick={handleGuestLogin}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Loading...' : 'Continue as Guest'}
                      </Button>
                    </div>
                  </motion.div>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <motion.div 
                    className="space-y-2"
                    custom={1} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                  >
                    <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        className="pl-10 bg-gray-800/50 border-gray-700 focus:border-indigo-500 text-white placeholder:text-gray-500"
                        {...registerForm.register('name')}
                      />
                    </div>
                    {registerForm.formState.errors.name && (
                      <p className="text-red-400 text-sm">{registerForm.formState.errors.name.message}</p>
                    )}
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    custom={2} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                  >
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                      <Input
                        id="email"
                        placeholder="your@email.com"
                        className="pl-10 bg-gray-800/50 border-gray-700 focus:border-indigo-500 text-white placeholder:text-gray-500"
                        {...registerForm.register('email')}
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-red-400 text-sm">{registerForm.formState.errors.email.message}</p>
                    )}
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    custom={3} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                  >
                    <Label htmlFor="password" className="text-gray-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 bg-gray-800/50 border-gray-700 focus:border-indigo-500 text-white placeholder:text-gray-500"
                        {...registerForm.register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-red-400 text-sm">{registerForm.formState.errors.password.message}</p>
                    )}
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    custom={4} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                  >
                    <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 bg-gray-800/50 border-gray-700 focus:border-indigo-500 text-white placeholder:text-gray-500"
                        {...registerForm.register('confirmPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-red-400 text-sm">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </motion.div>

                  <motion.div
                    custom={5} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                  >
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Account...
                        </div>
                      ) : (
                        <>
                          <span className="mr-2">Create Account</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>

                  <motion.div 
                    className="mt-4 relative"
                    custom={6} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    custom={7} 
                    variants={formAnimation}
                    initial="hidden"
                    animate="visible"
                    className="mt-4"
                  >
                    <div className="w-full flex justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => setError('Google sign-in failed. Please try again.')}
                        useOneTap
                        theme="filled_black"
                        text="signup_with"
                        shape="pill"
                        locale="en"
                      />
                    </div>
                  </motion.div>
                </form>
              </TabsContent>
            </Tabs>

            {/* Info message about wallet connection */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-6 pt-4 border-t border-gray-700/30"
            >
              <Alert className="bg-indigo-900/20 border border-indigo-500/20 text-indigo-200">
                <Info className="h-4 w-4" />
                <AlertTitle className="text-indigo-200 text-sm">Looking for wallet connection?</AlertTitle>
                <AlertDescription className="text-indigo-200/80 text-xs">
                  After creating an account, you can connect your wallet from your profile settings.
                </AlertDescription>
              </Alert>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="pt-4 text-center"
            >
              <p className="text-sm text-gray-400">
                By signing in, you agree to our{' '}
                <a href="#" className="text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
} 