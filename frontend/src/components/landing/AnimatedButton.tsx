'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AnimatedButtonProps = {
  children: React.ReactNode
  href: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  className?: string
  icon?: React.ReactNode
}

export default function AnimatedButton({ 
  children, 
  href, 
  variant = 'default',
  className = '',
  icon = <ArrowRight className="ml-2 h-5 w-5" />
}: AnimatedButtonProps) {
  const router = useRouter()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 30,
        delay: 0.1
      }}
      whileHover={{ 
        scale: 1.05,
        transition: { type: 'spring', stiffness: 400, damping: 10 }
      }}
      whileTap={{ scale: 0.97 }}
    >
      <Button
        onClick={() => router.push(href)}
        variant={variant}
        className={`relative overflow-hidden group ${className}`}
      >
        <span className="relative z-10 flex items-center">
          {children}
          <motion.span
            initial={{ x: -5, opacity: 0.5 }} 
            animate={{ x: 0, opacity: 1 }}
            transition={{ repeat: Infinity, repeatType: "mirror", duration: 1 }}
            className="inline-block ml-2"
          >
            {icon}
          </motion.span>
        </span>
        
        {/* Background glow effect */}
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-indigo-500/0 to-indigo-600/20"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ 
            repeat: Infinity,
            repeatType: "loop",
            duration: 3, 
            ease: "linear" 
          }}
        />
        
        {/* Border glow effect */}
        <span className="absolute inset-0 rounded-md overflow-hidden">
          <span className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-500/0 via-indigo-500/80 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
            style={{ 
              transform: 'translateX(-100%)',
              animation: 'shimmer 2s infinite' 
            }}
          />
        </span>
      </Button>
      
      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </motion.div>
  )
} 