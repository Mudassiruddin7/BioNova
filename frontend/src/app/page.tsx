'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap' // Restored GSAP import
import { ScrollTrigger } from 'gsap/ScrollTrigger' // Restored ScrollTrigger import
import dynamic from 'next/dynamic'

import HeroSection from '@/components/landing/HeroSection' // Uncommented HeroSection
import FeaturesSection from '@/components/landing/FeaturesSection' // Uncommented FeaturesSection
import InteractiveDNASection from '@/components/landing/InteractiveDNASection' // This is the only active section
import TechStackSection from '@/components/landing/TechStackSection' // Uncommented TechStackSection
import Footer from '@/components/landing/Footer' // Uncommented Footer
import MousePositionProvider from '@/components/landing/MousePositionProvider' // Restored MousePositionProvider
import SmoothScrollProvider from '@/components/landing/SmoothScrollProvider' // Restored SmoothScrollProvider

// Dynamic import for CustomCursor to avoid SSR issues
const CustomCursor = dynamic(() => import('@/components/landing/CustomCursor'), { ssr: false }) // Restored CustomCursor

export default function Home() {
  useEffect(() => { // Restored GSAP useEffect
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger)
    
    // Create scroll-based animations with better transitions
    const sections = document.querySelectorAll('section')
    
    // Background color transition
    gsap.fromTo(
      'body',
      { backgroundColor: '#0f172a' }, // dark blue
      {
        backgroundColor: '#020617', // darker blue
        scrollTrigger: {
          trigger: sections[1], // Trigger when the second section starts entering
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 1,
        },
      }
    )
    
    // Animate sections as they come into view
    sections.forEach((section, index) => {
      if (index > 0) { // Skip hero section
        gsap.fromTo(
          section,
          { 
            opacity: 0,
            y: 50 
          },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              end: 'top 30%',
              scrub: 1,
              toggleActions: 'play none none reverse',
            }
          }
        )
      }
    })
    
    return () => {
      // Clean up ScrollTrigger instances when component unmounts
      ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill())
    }
  }, [])
  
  return (
    <MousePositionProvider> {/* Restored MousePositionProvider */}
      <SmoothScrollProvider> {/* Restored SmoothScrollProvider */}
        <div className="bg-gray-900 text-white overflow-hidden min-h-screen flex flex-col">
          {/* Custom cursor */}
          <CustomCursor /> {/* Restored CustomCursor */}
          
          {/* Other sections commented out for testing */}
          <HeroSection /> {/* Uncommented HeroSection */}
          <FeaturesSection /> {/* Uncommented FeaturesSection */}
          <InteractiveDNASection /> {/* Only this section is active */}
          <TechStackSection /> {/* Uncommented TechStackSection */}
          
          {/* <div className="flex-grow"></div> */}{/* Removed flex-grow div */}
          
          {/* Footer commented out */}
          <Footer /> {/* Uncommented Footer */}
        </div>
      </SmoothScrollProvider>
    </MousePositionProvider>
  )
}
