'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DNA_COLORS } from '@/lib/constants/designTokens';

interface LoadingScreenProps {
  isLoading?: boolean;
  text?: string;
  fullScreen?: boolean;
  transparent?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading = true,
  text = 'Loading...',
  fullScreen = true,
  transparent = false,
  size = 'medium',
}) => {
  if (!isLoading) return null;
  
  // Determine size based on prop
  const getSize = () => {
    switch (size) {
      case 'small':
        return { outer: 'w-12 h-12', inner: 'w-6 h-6', text: 'text-xs' };
      case 'large':
        return { outer: 'w-32 h-32', inner: 'w-20 h-20', text: 'text-lg' };
      case 'medium':
      default:
        return { outer: 'w-24 h-24', inner: 'w-12 h-12', text: 'text-sm' };
    }
  };
  
  const sizeClasses = getSize();
  
  const variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.5 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.2 }
    }
  };
  
  const containerClass = fullScreen 
    ? 'fixed inset-0 z-50 flex items-center justify-center'
    : 'flex items-center justify-center w-full h-full min-h-[200px]';
    
  const backdropClass = transparent
    ? 'bg-transparent'
    : 'bg-black/50 backdrop-blur-sm';
    
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="loading-screen"
        className={`${containerClass} ${fullScreen ? backdropClass : ''}`}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={variants}
      >
        <motion.div 
          className="flex flex-col items-center"
          variants={itemVariants}
        >
          <div className="relative">
            {/* Outer spinning ring */}
            <motion.div 
              className={`${sizeClasses.outer} rounded-full border-t-2 border-r-2 border-indigo-500`}
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
            
            {/* Middle spinning ring */}
            <motion.div 
              className={`absolute inset-0 m-auto ${sizeClasses.inner} rounded-full border-b-2 border-l-2 border-cyan-400`}
              animate={{ rotate: -360 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
            
            {/* Center spinning element */}
            <motion.div 
              className="absolute inset-0 m-auto flex items-center justify-center"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <div className="relative">
                <motion.div 
                  className="w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full"
                  animate={{ 
                    boxShadow: [
                      '0 0 10px rgba(99, 102, 241, 0.7)', 
                      '0 0 20px rgba(99, 102, 241, 0.9)',
                      '0 0 10px rgba(99, 102, 241, 0.7)'
                    ]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
              </div>
            </motion.div>
          </div>
          
          {text && (
            <motion.div 
              className="mt-6"
              variants={itemVariants}
            >
              <motion.p 
                className={`${sizeClasses.text} font-medium text-center text-white bg-clip-text`}
                animate={{ 
                  background: [
                    'linear-gradient(to right, #4F46E5, #B16CEA)',
                    'linear-gradient(to right, #B16CEA, #00CCFF)',
                    'linear-gradient(to right, #00CCFF, #4F46E5)'
                  ],
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear" 
                }}
              >
                {text}
              </motion.p>
              
              {/* DNA strands animation */}
              <motion.div 
                className="mt-2 flex justify-center gap-1"
              >
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full bg-indigo-500"
                    animate={{
                      height: [1, 8, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingScreen; 