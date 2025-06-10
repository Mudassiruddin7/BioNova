'use client'

import React from 'react';
import SynapseButton from './core/SynapseButton';
import SynapseChat from './core/SynapseChat';
import SynapseContextBar from './core/SynapseContextBar';
import SynapseProvider from '../../lib/hooks/synapse/SynapseProvider';
import useSynapseShortcuts from '../../lib/hooks/synapse/useSynapseShortcuts';

const SynapseWithShortcuts = () => {
  // This component uses the shortcuts hook
  useSynapseShortcuts();
  
  return (
    <>
      <SynapseButton />
      <SynapseContextBar />
      <SynapseChat />
    </>
  );
};

const Synapse: React.FC = () => {
  return (
    <SynapseProvider>
      <SynapseWithShortcuts />
    </SynapseProvider>
  );
};

export default Synapse; 