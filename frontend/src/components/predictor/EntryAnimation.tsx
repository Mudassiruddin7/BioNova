'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface EntryAnimationProps {
  onAnimationComplete?: () => void;
}

export default function EntryAnimation({ onAnimationComplete }: EntryAnimationProps) {
  // Play subtle activation sound on component mount
  useEffect(() => {
    const playSound = () => {
      try {
        const audio = new Audio('/sounds/power-up.mp3'); // Path to your sound file
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Browser may block autoplay, silently handle the error
        });
      } catch (error) {
        // Handle any errors silently
      }
    };
    
    // Slight delay before playing sound
    const timeout = setTimeout(() => {
      playSound();
    }, 300);
    
    return () => clearTimeout(timeout);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1.5, delay: 2.0 }}
      onAnimationComplete={onAnimationComplete}
    >
      {/* Futuristic loading sequence */}
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Scanlines overlay */}
        <div className="absolute inset-0 bg-[url('/scanlines.svg')] opacity-10 pointer-events-none z-10"></div>
        
        {/* Central logo/icon */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-32 h-32 rounded-full bg-indigo-900/30 border border-indigo-500/30 flex items-center justify-center"
            animate={{ 
              boxShadow: ['0 0 0px rgba(80, 70, 230, 0.3)', '0 0 40px rgba(80, 70, 230, 0.8)', '0 0 10px rgba(80, 70, 230, 0.5)']
            }}
            transition={{ duration: 2, repeat: 0 }}
          >
            <motion.div 
              className="text-cyan-300 text-6xl"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              🧬
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Typing text */}
        <motion.div 
          className="mt-8 font-mono text-cyan-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <TypewriterText 
            text="Initializing CRISPR Predictor..." 
            delay={100}
          />
        </motion.div>
        
        {/* Loading progress bar */}
        <motion.div 
          className="w-64 h-1 bg-gray-800 mt-6 rounded-full overflow-hidden"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 256 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.4, duration: 1 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

// Helper component for typewriter effect
function TypewriterText({ text, delay = 50 }: { text: string; delay?: number }) {
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay / 1000,
        delayChildren: 0
      }
    }
  };

  const childVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="inline-block"
    >
      {text.split('').map((char, i) => (
        <motion.span key={i} variants={childVariants} className="inline-block">
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
} 