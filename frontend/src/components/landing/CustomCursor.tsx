'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useMousePosition } from '@/lib/hooks/useMousePosition'

export default function CustomCursor() {
  const [cursorVariant, setCursorVariant] = useState('default')
  const { x, y } = useMousePosition()
  
  useEffect(() => {
    // Add hover detection to clickable elements
    const handleMouseEnter = () => setCursorVariant('hover')
    const handleMouseLeave = () => setCursorVariant('default')
    
    // Add event listeners to buttons, links, and other interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"]')
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mouseleave', handleMouseLeave)
    })
    
    return () => {
      // Clean up
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, [])
  
  // Variants for cursor animation
  const variants = {
    default: {
      height: 16,
      width: 16,
      borderWidth: 2,
      backgroundColor: 'rgba(67, 97, 238, 0.1)',
      borderColor: 'rgba(67, 97, 238, 0.5)',
      x: x ? x - 8 : 0, // Center the cursor
      y: y ? y - 8 : 0,
      mixBlendMode: 'difference' as 'difference'
    },
    hover: {
      height: 40,
      width: 40,
      borderWidth: 2,
      backgroundColor: 'rgba(67, 97, 238, 0.3)',
      borderColor: 'rgba(67, 97, 238, 0.8)',
      x: x ? x - 20 : 0, // Center the cursor
      y: y ? y - 20 : 0,
      mixBlendMode: 'difference' as 'difference'
    }
  }
  
  return (
    <>
      <motion.div
        className="fixed top-0 left-0 z-50 rounded-full pointer-events-none hidden md:block"
        variants={variants}
        animate={cursorVariant}
        transition={{ 
          type: 'spring', 
          stiffness: 1000, 
          damping: 50,
          mass: 0.5
        }}
      />
      
      {/* Glow effect */}
      <motion.div
        className="fixed top-0 left-0 z-40 rounded-full pointer-events-none hidden md:block blur-md opacity-50"
        variants={{
          default: {
            height: 30,
            width: 30,
            backgroundColor: 'rgba(67, 97, 238, 0.2)',
            x: x ? x - 15 : 0,
            y: y ? y - 15 : 0,
          },
          hover: {
            height: 60,
            width: 60,
            backgroundColor: 'rgba(67, 97, 238, 0.5)',
            x: x ? x - 30 : 0,
            y: y ? y - 30 : 0,
          }
        }}
        animate={cursorVariant}
        transition={{ 
          type: 'spring', 
          stiffness: 500, 
          damping: 30,
          mass: 0.8
        }}
      />
    </>
  )
} 