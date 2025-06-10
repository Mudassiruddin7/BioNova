'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils'

interface AnimatedTextProps {
  text: string
  className?: string
  once?: boolean
  threshold?: number
  stagger?: number
  splitWords?: boolean
}

export default function AnimatedText({
  text,
  className = '',
  once = false,
  threshold = 0.1,
  stagger = 0.05,
  splitWords = false,
}: AnimatedTextProps) {
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    
    if (!textRef.current) return
    
    const splitTextElement = textRef.current
    let chars: HTMLElement[] = []
    
    if (splitWords) {
      // Split into words
      const words = text.split(' ')
      splitTextElement.innerHTML = ''
      
      words.forEach((word, i) => {
        const wordSpan = document.createElement('span')
        wordSpan.className = 'inline-block overflow-hidden'
        
        const innerSpan = document.createElement('span')
        innerSpan.className = 'inline-block translate-y-full opacity-0'
        innerSpan.textContent = word
        
        wordSpan.appendChild(innerSpan)
        splitTextElement.appendChild(wordSpan)
        
        if (i < words.length - 1) {
          splitTextElement.appendChild(document.createTextNode(' '))
        }
        
        chars.push(innerSpan)
      })
    } else {
      // Split into characters
      const characters = text.split('')
      splitTextElement.innerHTML = ''
      
      characters.forEach((char) => {
        const charSpan = document.createElement('span')
        charSpan.className = 'inline-block overflow-hidden'
        
        const innerSpan = document.createElement('span')
        innerSpan.className = 'inline-block translate-y-full opacity-0'
        innerSpan.textContent = char === ' ' ? '\u00A0' : char
        
        charSpan.appendChild(innerSpan)
        splitTextElement.appendChild(charSpan)
        chars.push(innerSpan)
      })
    }
    
    ScrollTrigger.create({
      trigger: splitTextElement,
      start: `top bottom-=${threshold * 100}%`,
      onEnter: () => {
        gsap.to(chars, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: stagger,
        })
      },
      onLeave: () => {
        if (!once) {
          gsap.to(chars, {
            y: '100%',
            opacity: 0,
            duration: 0.6,
            ease: 'power3.in',
          })
        }
      },
      onEnterBack: () => {
        if (!once) {
          gsap.to(chars, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: stagger,
          })
        }
      },
      onLeaveBack: () => {
        if (!once) {
          gsap.to(chars, {
            y: '100%',
            opacity: 0,
            duration: 0.6,
            ease: 'power3.in',
          })
        }
      },
    })
    
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [text, once, threshold, stagger, splitWords])

  return (
    <div ref={textRef} className={cn('inline', className)}>
      {text}
    </div>
  )
} 