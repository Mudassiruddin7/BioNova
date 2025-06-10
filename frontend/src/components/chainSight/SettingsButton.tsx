"use client";

import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChainSightStore } from '@/lib/stores/chainSightStore';
import { DNA_COLORS, EFFECTS } from '@/lib/constants/designTokens';

export const SettingsButton = () => {
  const { toggleSettings } = useChainSightStore();
  
  return (
    <motion.button
      className="fixed bottom-8 right-8 p-3.5 rounded-full z-30"
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
      onClick={toggleSettings}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
      whileHover={{ 
        scale: 1.1,
        boxShadow: EFFECTS.glows.cyan
      }}
      whileTap={{ scale: 0.95 }}
    >
      <Settings size={24} style={{ color: DNA_COLORS.primary }} />
    </motion.button>
  );
}; 