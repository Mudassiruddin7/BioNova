'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { TbBrandPython, TbBrandReact, TbBrandNextjs, TbBrandMongodb, TbBrandOpenai, TbBrandThreejs } from 'react-icons/tb'
import { SiFramer, SiTensorflow, SiMetabase, SiWeb3Dotjs } from 'react-icons/si'

// Tech logo component with hover effect
function TechLogo({ 
  icon, 
  name,
  delay = 0
}: { 
  icon: React.ReactNode
  name: string
  delay?: number
}) {
  return (
    <motion.div
      className="flex flex-col items-center mx-6 my-4 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        delay: delay * 0.1
      }}
      whileHover={{ scale: 1.1 }}
    >
      <div className="text-gray-400 group-hover:text-indigo-400 transition-colors duration-300 text-4xl md:text-5xl relative">
        {icon}
        {/* Glow effect */}
        <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/20 rounded-full blur-xl -z-10 scale-150 opacity-0 group-hover:opacity-100 transition-all duration-300" />
      </div>
      <div className="mt-2 text-xs text-gray-500 group-hover:text-gray-300 transition-colors duration-300">{name}</div>
    </motion.div>
  )
}

export default function TechStackSection() {
  // Tech logos
  const techLogos = [
    { name: 'Python', icon: <TbBrandPython /> },
    { name: 'React', icon: <TbBrandReact /> },
    { name: 'Next.js', icon: <TbBrandNextjs /> },
    { name: 'MongoDB', icon: <TbBrandMongodb /> },
    { name: 'OpenAI', icon: <TbBrandOpenai /> },
    { name: 'Framer', icon: <SiFramer /> },
    { name: 'TensorFlow', icon: <SiTensorflow /> },
    { name: 'Base', icon: <SiMetabase /> },
    { name: 'Web3', icon: <SiWeb3Dotjs /> },
    { name: 'Three.js', icon: <TbBrandThreejs /> },
  ]
  
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 })
  
  return (
    <section 
      ref={sectionRef}
      className="relative py-16 bg-gradient-to-b from-gray-900 to-indigo-950 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-2">Powered By</h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Built using cutting-edge technologies for performance and reliability
          </p>
        </motion.div>
        
        {/* Scrolling logos section */}
        <div className="relative">
          {/* First row scrolling left */}
          <motion.div 
            className="flex flex-wrap justify-center md:justify-between items-center py-4"
            animate={isInView ? { 
              x: [0, -20, 0],
            } : {}}
            transition={{ 
              repeat: Infinity,
              repeatType: "mirror",
              duration: 20,
              ease: "linear"
            }}
          >
            {techLogos.slice(0, 5).map((tech, index) => (
              <TechLogo 
                key={index} 
                icon={tech.icon} 
                name={tech.name} 
                delay={index}
              />
            ))}
          </motion.div>
          
          {/* Second row scrolling right */}
          <motion.div 
            className="flex flex-wrap justify-center md:justify-between items-center py-4"
            animate={isInView ? { 
              x: [0, 20, 0],
            } : {}}
            transition={{ 
              repeat: Infinity,
              repeatType: "mirror",
              duration: 20,
              ease: "linear"
            }}
          >
            {techLogos.slice(5).map((tech, index) => (
              <TechLogo 
                key={index} 
                icon={tech.icon} 
                name={tech.name} 
                delay={index + 5}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
} 