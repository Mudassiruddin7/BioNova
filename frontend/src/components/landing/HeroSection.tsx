'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Dna, Gauge, ArrowRight, ShieldCheck } from 'lucide-react'
import { useMousePosition } from '@/lib/hooks/useMousePosition'
import { useAuth } from '@/lib/hooks/useAuth'
import AnimatedButton from './AnimatedButton'
import ParticleBackground from './ParticleBackground'

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated, isInitialized } = useAuth()
  // Type assertion to make TypeScript happy - we know this works at runtime
  const { x, y } = useMousePosition(containerRef as any)
  
  // Normalize mouse position to -0.5 to 0.5
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  if (containerRef.current && x && y) {
    const rect = containerRef.current.getBoundingClientRect()
    const normalizedX = (x - rect.left) / rect.width - 0.5
    const normalizedY = (y - rect.top) / rect.height - 0.5
    mouseX.set(normalizedX)
    mouseY.set(normalizedY)
  }

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 via-indigo-950/90 to-gray-900"
    >
      {/* Particle background */}
      <ParticleBackground />
      
      {/* Content - centered with glass morphism effect */}
      <div className="container mx-auto px-4 z-20 relative">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-3xl backdrop-blur-lg bg-gray-900/30 p-10 rounded-2xl border border-indigo-500/20 shadow-xl"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight text-center">
              <motion.span 
                className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                BioNova
              </motion.span>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-2"
              >
                <span className="text-white">AI-Powered CRISPR</span>
                <span className="text-indigo-400"> Intelligence</span>
              </motion.div>
            </h1>
            
            <motion.p 
              className="mt-6 text-xl text-gray-300 max-w-xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Predict gene edits. Monitor lab conditions. Secure your research.
            </motion.p>
            
            <motion.div 
              className="mt-10 flex flex-col md:flex-row justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <AnimatedButton 
                href="/gene-predictor" 
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-600/30 backdrop-blur-sm"
                icon={<Dna className="ml-2 h-5 w-5" />}
              >
                Try CRISPR Predictor
              </AnimatedButton>
              
              <AnimatedButton 
                href="/lab-monitor" 
                variant="secondary"
                className="px-6 py-3 rounded-lg shadow-lg shadow-indigo-900/20 backdrop-blur-sm"
                icon={<Gauge className="ml-2 h-5 w-5" />}
              >
                Live Lab Monitor
              </AnimatedButton>
              
              <AnimatedButton 
                href="/chainSight" 
                variant="outline"
                className="px-6 py-3 text-white border-white hover:bg-white/10 rounded-lg shadow-lg backdrop-blur-sm"
                icon={<ShieldCheck className="ml-2 h-5 w-5" />}
              >
                Blockchain Portal
              </AnimatedButton>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ 
          duration: 1.2, 
          delay: 1.2,
        }}
      >
        <div className="flex flex-col items-center">
          <span className="text-gray-400 text-sm mb-2 backdrop-blur-sm px-3 py-1 rounded-full bg-gray-800/30">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-gray-400/50 rounded-full flex justify-center p-1 backdrop-blur-sm bg-gray-800/20">
            <motion.div 
              className="w-1 h-1 bg-indigo-400 rounded-full"
              animate={{ 
                y: [0, 12, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  )
} 
