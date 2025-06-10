"use client";

import { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Text3D, Text, useGLTF } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useChainSightStore } from '@/lib/stores/chainSightStore';
import { DNAHelix } from './models/DNAHelix';
import { useWalletState } from '@/lib/hooks/useWalletState';
import { DNA_COLORS } from '@/lib/constants/designTokens';

export const GenesisCore = () => {
  const { records, toggleSequencer } = useChainSightStore();
  const { isWalletConnected, isWalletAuthorized } = useWalletState();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDNALoaded, setIsDNALoaded] = useState(false);
  
  // Get latest block info from the first record if available
  const latestRecord = records[0];
  const latestBlock = latestRecord?.blockNumber ?? '------';
  const shortHash = latestRecord?.txHash 
    ? `${latestRecord.txHash.substring(0, 6)}...${latestRecord.txHash.substring(62)}`
    : '------';
  const network = 'POLYGON';
  
  // Format timestamp for display
  const timestamp = latestRecord
    ? new Date(latestRecord.timestamp).toLocaleTimeString()
    : '00:00:00';

  return (
    <motion.div 
      ref={containerRef}
      className="py-8 md:py-16 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* 3D Canvas */}
      <div 
        className="relative h-[40vh] md:h-[50vh] w-full rounded-xl overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.2), 0 0 15px rgba(255, 0, 255, 0.1)'
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 20], fov: 45 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} color={DNA_COLORS.secondary} intensity={0.5} />
          
          <Float
            speed={2}
            rotationIntensity={0.5}
            floatIntensity={1}
          >
            <DNAHelix 
              position={[0, 0, 0]}
              rotation={[0, Math.PI / 4, 0]}
              scale={2.5}
              onLoad={() => setIsDNALoaded(true)}
            />
          </Float>
          
          {/* Text elements for latest block info */}
          {isDNALoaded && (
            <>
              <Text
                position={[0, 7, 0]}
                fontSize={0.8}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                CHAINSIGHT
              </Text>
              
              <Text
                position={[0, -7, 0]}
                fontSize={0.4}
                color="#00ffff"
                anchorX="center"
                anchorY="middle"
              >
                {`BLOCK: ${latestBlock} :: HASH: ${shortHash} :: NETWORK: ${network} :: SYNCED: ${timestamp}`}
              </Text>
            </>
          )}
          
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
            minAzimuthAngle={-Math.PI / 4}
            maxAzimuthAngle={Math.PI / 4}
          />
        </Canvas>
      </div>
      
      {/* Text Overlay */}
      <div className="relative z-10 text-center mt-8 md:mt-12">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500 leading-tight">
          ChainSight: Mapping the Genome's Immutable Journey
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
          Explore, verify, and contribute to the cryptographically secured ledger of genetic discovery.
        </p>
        
        {/* Call to Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <motion.button
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-semibold flex items-center gap-2 hover:shadow-glow-cyan"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              document.getElementById('data-stream')?.scrollIntoView({
                behavior: 'smooth'
              });
            }}
          >
            <span>🔬</span>
            <span>Explore Data Stream</span>
          </motion.button>
          
          {isWalletConnected && isWalletAuthorized && (
            <motion.button
              className="px-6 py-3 rounded-lg border border-fuchsia-500 text-white font-semibold flex items-center gap-2 hover:shadow-glow-magenta"
              whileHover={{ 
                scale: 1.05,
                borderColor: "#ff00ff",
                boxShadow: "0 0 15px rgba(255, 0, 255, 0.5)"
              }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleSequencer}
            >
              <span>➕</span>
              <span>Sequence New Entry</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}; 