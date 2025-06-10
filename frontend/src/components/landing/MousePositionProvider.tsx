'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface MousePositionContextType {
  mousePosition: { x: number; y: number }
}

const MousePositionContext = createContext<MousePositionContextType>({
  mousePosition: { x: 0, y: 0 },
})

export const useMousePositionContext = () => useContext(MousePositionContext)

export default function MousePositionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <MousePositionContext.Provider value={{ mousePosition }}>
      {children}
    </MousePositionContext.Provider>
  )
} 