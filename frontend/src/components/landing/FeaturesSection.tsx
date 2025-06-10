'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Dna, Gauge, ShieldCheck } from 'lucide-react'
import { useMousePosition } from '@/lib/hooks/useMousePosition'

// Feature card component with tilt effect
function FeatureCard({ 
  icon, 
  title, 
  description,
  delay = 0 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  delay?: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(cardRef, { once: true, amount: 0.3 })
  const { x, y } = useMousePosition()
  
  // Calculate tilt effect based on mouse position
  const calcTiltEffect = () => {
    if (!cardRef.current || x === null || y === null) return { rotateX: 0, rotateY: 0 }
    
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const rotateX = (centerY - y) / 50 // Max rotation 10 degrees
    const rotateY = (x - centerX) / 50
    
    return { rotateX, rotateY }
  }
  
  const { rotateX, rotateY } = calcTiltEffect()
  
  return (
    <motion.div
      ref={cardRef}
      className="relative bg-gradient-to-br from-gray-900 to-indigo-950 rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ 
        duration: 0.8, 
        delay: delay * 0.2,
        type: 'spring',
        stiffness: 100
      }}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)',
        willChange: 'transform',
        transition: 'transform 0.2s ease-out'
      }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/30 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-8 h-full">
        {/* Floating effect for the icon */}
        <motion.div
          className="w-16 h-16 mb-6 rounded-full flex items-center justify-center bg-indigo-900/50"
          animate={{ 
            y: [0, -8, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        >
          <div className="text-indigo-400">
            {icon}
          </div>
        </motion.div>
        
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-300">{description}</p>
        
        {/* Glowing dots in the background */}
        <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-indigo-500/50 blur-sm" />
        <div className="absolute bottom-8 right-8 w-2 h-2 rounded-full bg-indigo-400/30 blur-sm" />
        <div className="absolute top-6 right-10 w-1 h-1 rounded-full bg-indigo-300/20 blur-sm" />
        
        {/* Border shine effect */}
        <div className="absolute inset-0 border border-indigo-500/20 rounded-xl" />
      </div>
    </motion.div>
  )
}

export default function FeaturesSection() {
  const features = [
    {
      icon: <Dna className="h-8 w-8" />,
      title: 'AI-Powered CRISPR Prediction',
      description: 'Input DNA sequences and receive AI-generated predictions on possible gene edits with detailed explanations.',
    },
    {
      icon: <Gauge className="h-8 w-8" />,
      title: 'Real-time Lab Monitoring',
      description: 'Monitor laboratory environmental conditions in real-time to ensure optimal experiment settings.',
    },
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      title: 'Blockchain Verification',
      description: 'Secure your research data with immutable blockchain records, ensuring transparency and reproducibility.',
    },
  ]

  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })
  
  return (
    <section
      ref={sectionRef}
      className="relative py-24 bg-gradient-to-b from-gray-900 to-indigo-950"
    >
      <div className="absolute inset-0 bg-[url('/hex-grid.svg')] bg-repeat opacity-5" />
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Cutting-Edge Features</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          BioNova combines powerful AI, IoT, and blockchain technologies to enhance your research experience
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
} 