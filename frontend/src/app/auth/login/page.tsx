'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { motion } from 'framer-motion';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950/90 to-gray-900 flex items-center justify-center">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Welcome Back
          </h1>
          <p className="text-gray-400 mt-2">
            Sign in to your account to continue
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-md"
        >
          <LoginForm />
        </motion.div>
      </div>
    </div>
  );
} 