'use client'

import { useEffect } from 'react';
import { useSynapse } from './SynapseProvider';

export const useSynapseShortcuts = () => {
  const { openChat, closeChat, isChatOpen } = useSynapse();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Open/close Synapse with Ctrl+Space
      if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        if (isChatOpen) {
          closeChat();
        } else {
          openChat();
        }
      }
      
      // Close Synapse with Escape if it's open
      if (event.key === 'Escape' && isChatOpen) {
        closeChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openChat, closeChat, isChatOpen]);
  
  // This hook doesn't return anything, it just registers the shortcuts
  return null;
};

export default useSynapseShortcuts; 