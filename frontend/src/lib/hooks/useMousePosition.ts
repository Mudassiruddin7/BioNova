import { useState, useEffect, RefObject } from 'react'

interface MousePosition {
  x: number | null
  y: number | null
}

export const useMousePosition = (ref?: RefObject<HTMLElement>): MousePosition => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: null, y: null })

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY })
    }

    window.addEventListener('mousemove', updateMousePosition)

    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
    }
  }, [])

  return mousePosition
} 