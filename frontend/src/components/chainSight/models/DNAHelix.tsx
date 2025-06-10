"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { DNA_COLORS } from '@/lib/constants/designTokens';

// Number of nucleotides in our DNA strand
const HELIX_SEGMENTS = 30;
const STRAND_WIDTH = 0.2;
const SPHERE_RADIUS = 0.4;
const HELIX_RADIUS = 2;

interface DNAHelixProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onLoad?: () => void;
}

export const DNAHelix = ({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1,
  onLoad
}: DNAHelixProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Material for the DNA strands
  const strandMaterial1 = useMemo(() => new THREE.MeshStandardMaterial({
    color: DNA_COLORS.primary,
    transparent: true,
    opacity: 0.8,
    emissive: DNA_COLORS.primary,
    emissiveIntensity: 0.3,
  }), []);
  
  const strandMaterial2 = useMemo(() => new THREE.MeshStandardMaterial({
    color: DNA_COLORS.secondary,
    transparent: true,
    opacity: 0.8,
    emissive: DNA_COLORS.secondary,
    emissiveIntensity: 0.3,
  }), []);
  
  // Material for the nucleotides
  const nucleotideMaterials = useMemo(() => [
    new THREE.MeshStandardMaterial({
      color: DNA_COLORS.primary,
      emissive: DNA_COLORS.primary,
      emissiveIntensity: 0.5,
    }),
    new THREE.MeshStandardMaterial({
      color: DNA_COLORS.secondary,
      emissive: DNA_COLORS.secondary,
      emissiveIntensity: 0.5,
    }),
    new THREE.MeshStandardMaterial({
      color: DNA_COLORS.tertiary,
      emissive: DNA_COLORS.tertiary,
      emissiveIntensity: 0.5,
    }),
    new THREE.MeshStandardMaterial({
      color: DNA_COLORS.accent,
      emissive: DNA_COLORS.accent,
      emissiveIntensity: 0.5,
    }),
  ], []);
  
  // Create the helix geometry
  const { strand1Points, strand2Points } = useMemo(() => {
    const strand1Points: THREE.Vector3[] = [];
    const strand2Points: THREE.Vector3[] = [];
    
    // Parameters for the helix
    const height = 10;
    const turnHeight = height / (HELIX_SEGMENTS / 4);
    
    // Create points for both strands of the helix
    for (let i = 0; i <= HELIX_SEGMENTS; i++) {
      const y = (i / HELIX_SEGMENTS) * height - height / 2;
      const angle1 = (i / HELIX_SEGMENTS) * Math.PI * 8;
      const angle2 = angle1 + Math.PI;
      
      const x1 = Math.cos(angle1) * HELIX_RADIUS;
      const z1 = Math.sin(angle1) * HELIX_RADIUS;
      
      const x2 = Math.cos(angle2) * HELIX_RADIUS;
      const z2 = Math.sin(angle2) * HELIX_RADIUS;
      
      strand1Points.push(new THREE.Vector3(x1, y, z1));
      strand2Points.push(new THREE.Vector3(x2, y, z2));
    }
    
    return { strand1Points, strand2Points };
  }, []);
  
  // Create the curve for both strands
  const strand1Curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(strand1Points);
  }, [strand1Points]);
  
  const strand2Curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(strand2Points);
  }, [strand2Points]);
  
  // Animation
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating rotation
      groupRef.current.rotation.y += 0.002;
      
      // Subtle pulsing effect
      const t = state.clock.getElapsedTime();
      const pulse = Math.sin(t * 0.5) * 0.05 + 1;
      groupRef.current.scale.set(pulse * scale, scale, pulse * scale);
    }
  });
  
  // Notify when loaded
  useEffect(() => {
    if (!isLoaded) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [isLoaded, onLoad]);
  
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* First DNA strand */}
      <mesh material={strandMaterial1}>
        <tubeGeometry args={[strand1Curve, 64, STRAND_WIDTH, 8, false]} />
      </mesh>
      
      {/* Second DNA strand */}
      <mesh material={strandMaterial2}>
        <tubeGeometry args={[strand2Curve, 64, STRAND_WIDTH, 8, false]} />
      </mesh>
      
      {/* Nucleotides (Base pairs) */}
      {strand1Points.map((point, i) => {
        if (i % 2 === 0 && i < strand2Points.length) {
          const materialIndex = i % nucleotideMaterials.length;
          return (
            <group key={`pair-${i}`}>
              {/* Nucleotide on first strand */}
              <mesh position={point} material={nucleotideMaterials[materialIndex]}>
                <sphereGeometry args={[SPHERE_RADIUS, 16, 16]} />
              </mesh>
              
              {/* Nucleotide on second strand */}
              <mesh position={strand2Points[i]} material={nucleotideMaterials[materialIndex]}>
                <sphereGeometry args={[SPHERE_RADIUS, 16, 16]} />
              </mesh>
              
              {/* Connector between the nucleotides */}
              <mesh>
                <meshStandardMaterial
                  color="#ffffff"
                  transparent={true}
                  opacity={0.3}
                />
                <cylinderGeometry 
                  args={[0.05, 0.05, point.distanceTo(strand2Points[i]), 6, 1]} 
                />
                <group 
                  position={point}
                  lookAt={strand2Points[i]}
                >
                  <mesh 
                    position={[0, point.distanceTo(strand2Points[i])/2, 0]} 
                    rotation={[Math.PI/2, 0, 0]}
                  >
                    <cylinderGeometry args={[0.05, 0.05, point.distanceTo(strand2Points[i]), 6, 1]} />
                  </mesh>
                </group>
              </mesh>
            </group>
          );
        }
        return null;
      })}
      
      {/* Blockchain nodes integrated with the DNA */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = HELIX_RADIUS * 1.8;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (i - 4) * 1.2;
        
        return (
          <group key={`node-${i}`} position={[x, y, z]}>
            {/* Blockchain node */}
            <mesh>
              <boxGeometry args={[0.8, 0.8, 0.8]} />
              <meshStandardMaterial
                color="#444466"
                metalness={0.8}
                roughness={0.2}
                transparent={true}
                opacity={0.8}
              />
            </mesh>
            
            {/* Inner glow */}
            <pointLight
              color={i % 2 === 0 ? DNA_COLORS.primary : DNA_COLORS.secondary}
              intensity={0.5}
              distance={1.5}
            />
          </group>
        );
      })}
    </group>
  );
}; 