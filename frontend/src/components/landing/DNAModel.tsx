'use client'

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Float } from '@react-three/drei'
import * as THREE from 'three'
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion'

// Enhanced DNA strand with smoother animations
export function DNAModel({ mouseX, mouseY }: { mouseX: any; mouseY: any }) {
  const dnaRef = useRef<THREE.Group>(null)
  const { viewport } = useThree()

  // Create a more gentle spring-based rotation that follows mouse position
  const rotY = useTransform(mouseX, [-0.5, 0.5], [-0.05, 0.05])
  const rotX = useTransform(mouseY, [-0.5, 0.5], [0.05, -0.05])
  
  // Add softer spring physics for smoother motion
  const springRotY = useSpring(rotY, { stiffness: 50, damping: 40 })
  const springRotX = useSpring(rotX, { stiffness: 50, damping: 40 })

  // Number of base pairs in our DNA
  const pairsCount = 20
  const height = 10 // Increased height for more elegant appearance
  const spacing = height / pairsCount
  
  useFrame((state, delta) => {
    if (dnaRef.current) {
      // Slower continuous rotation for smoother motion
      dnaRef.current.rotation.y += delta * 0.05
      
      // Apply the spring-based rotation from mouse position with gentler effect
      dnaRef.current.rotation.y += springRotY.get() * 0.05
      dnaRef.current.rotation.x += springRotX.get() * 0.05
    }
  })

  // Generate smoother helix points with more points for better curves
  const generateHelixPoints = (radius: number, height: number, turns: number, pointsCount: number) => {
    const points = []
    for (let i = 0; i < pointsCount; i++) {
      const angle = (i / pointsCount) * Math.PI * 2 * turns
      const y = (i / pointsCount) * height - height / 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      points.push(new THREE.Vector3(x, y, z))
    }
    return points
  }

  // Create the strands with more points for smoother curves
  const strand1Points = generateHelixPoints(1, height, 2, 150)
  const strand2Points = generateHelixPoints(1, height, 2, 150).map(point => {
    // Offset the second strand by half a turn
    const newPoint = point.clone()
    newPoint.x = -newPoint.x
    newPoint.z = -newPoint.z
    return newPoint
  })

  return (
    <group 
      ref={dnaRef}
    >
      <Float speed={0.3} rotationIntensity={0.1} floatIntensity={0.05}>
        {/* DNA backbones (two helix strands) */}
        <group>
          {/* First strand */}
          <mesh>
            <tubeGeometry args={[
              new THREE.CatmullRomCurve3(strand1Points),
              150, 0.1, 12, false
            ]} />
            <meshStandardMaterial 
              color="#4361ee" 
              emissive="#2f3ddf" 
              emissiveIntensity={0.4} 
              transparent={true} 
              opacity={0.6} 
            />
          </mesh>
          
          {/* Second strand */}
          <mesh>
            <tubeGeometry args={[
              new THREE.CatmullRomCurve3(strand2Points),
              150, 0.1, 12, false
            ]} />
            <meshStandardMaterial 
              color="#3f37c9" 
              emissive="#1a1464" 
              emissiveIntensity={0.4} 
              transparent={true} 
              opacity={0.6} 
            />
          </mesh>
          
          {/* Base pairs connecting the strands */}
          {Array.from({ length: pairsCount }).map((_, i) => {
            const y = i * spacing - height / 2 + spacing / 2
            const angle = (i / pairsCount) * Math.PI * 2 * 2 // 2 full turns
            
            const x1 = Math.cos(angle) * 1
            const z1 = Math.sin(angle) * 1
            
            // Second point is on opposite side
            const x2 = -x1
            const z2 = -z1
            
            return (
              <group key={i} position-y={y}>
                <mesh position={[x1 * 0.5, 0, z1 * 0.5]}>
                  <sphereGeometry args={[0.15, 24, 24]} />
                  <meshStandardMaterial 
                    color={i % 4 === 0 || i % 4 === 3 ? '#ff0a54' : '#3a86ff'} 
                    emissive={i % 4 === 0 || i % 4 === 3 ? '#ff0a54' : '#3a86ff'} 
                    emissiveIntensity={0.7}
                    transparent={true}
                    opacity={0.7}
                  />
                </mesh>
                
                <mesh position={[x2 * 0.5, 0, z2 * 0.5]}>
                  <sphereGeometry args={[0.15, 24, 24]} />
                  <meshStandardMaterial 
                    color={i % 4 === 0 || i % 4 === 3 ? '#ff0a54' : '#3a86ff'} 
                    emissive={i % 4 === 0 || i % 4 === 3 ? '#ff0a54' : '#3a86ff'} 
                    emissiveIntensity={0.7}
                    transparent={true}
                    opacity={0.7}
                  />
                </mesh>
                
                {/* The connection between bases - more faded */}
                <mesh>
                  <cylinderGeometry args={[0.04, 0.04, Math.sqrt((x2-x1)**2 + (z2-z1)**2), 12]} />
                  <meshStandardMaterial color="#f8f9fa" transparent={true} opacity={0.4} />
                  <group position={[(x1 + x2) / 2, 0, (z1 + z2) / 2]}>
                    <mesh
                      rotation={[Math.PI / 2, 0, Math.atan2(z2 - z1, x2 - x1)]}
                    >
                      <cylinderGeometry args={[0.04, 0.04, 2, 12]} />
                      <meshStandardMaterial color="#f8f9fa" transparent={true} opacity={0.4} />
                    </mesh>
                  </group>
                </mesh>
              </group>
            )
          })}
        </group>
      </Float>
    </group>
  )
}

// Scene wrapper component with improved lighting
export default function DNAScene({ mouseX, mouseY }: { mouseX: any; mouseY: any }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.6} color="#ffffff" />
      <pointLight position={[-10, -10, -5]} intensity={0.4} color="#3a86ff" />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={0.5} color="#ffffff" />
      <DNAModel mouseX={mouseX} mouseY={mouseY} />
    </>
  )
} 