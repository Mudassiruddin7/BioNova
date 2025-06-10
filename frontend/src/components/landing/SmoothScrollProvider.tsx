'use client'

import { ReactNode, useEffect } from 'react'
import Lenis from '@studio-freight/lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger)
    
    // Initialize Lenis smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential easing
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    })

    // Integrate with GSAP's ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    // Create a function to link GSAP's ticker with Lenis
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    
    // Clean up when unmounting
    return () => {
      lenis.destroy()
      gsap.ticker.remove(lenis.raf)
    }
  }, [])

  return <>{children}</>
} 