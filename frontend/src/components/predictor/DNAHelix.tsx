'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Environment, Sparkles, Text, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion-3d';
import { MotionConfig } from 'framer-motion';

// DNA base colors
const BASE_COLORS = {
  'A': new THREE.Color('#3a86ff'), // Blue
  'T': new THREE.Color('#ff006e'), // Pink
  'G': new THREE.Color('#8338ec'), // Purple
  'C': new THREE.Color('#06d6a0')  // Green
};

interface DNAStrandProps {
  highlightBases?: number[];
  editPositions?: number[];
  sequence?: string;
  rotationSpeed?: number;
  interactive?: boolean;
}

function DNAStrand({ 
  highlightBases = [], 
  editPositions = [],
  sequence = '',
  rotationSpeed = 0.1,
  interactive = true
}: DNAStrandProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [activeBase, setActiveBase] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const { camera } = useThree();
  
  // Number of base pairs in our DNA
  const pairsCount = sequence ? Math.min(sequence.length, 30) : 20;
  const height = 10;
  const spacing = height / pairsCount;
  
  // Handle camera animation to zoom to a specific base
  useEffect(() => {
    if (activeBase !== null && interactive) {
      // Calculate the y position of the active base
      const y = activeBase * spacing - height / 2 + spacing / 2;
      
      // Move camera to focus on this base
      const targetPosition = new THREE.Vector3(camera.position.x * 0.8, y, camera.position.z * 0.8);
      const originalPosition = new THREE.Vector3(0, 0, 10);
      
      // Animate camera position
      let startTime = Date.now();
      const duration = 1000; // 1 second
      
      const animateCamera = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress < 1) {
          // Interpolate between original and target positions
          camera.position.lerpVectors(
            originalPosition, 
            targetPosition, 
            progress
          );
          requestAnimationFrame(animateCamera);
        }
      };
      
      if (interactive) {
        animateCamera();
      }
    }
  }, [activeBase, camera, spacing, height, interactive]);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Continuous rotation around Y axis with variable speed
      groupRef.current.rotation.y += delta * rotationSpeed;
      
      // Add subtle oscillation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  // Generate helix points
  const generateHelixPoints = (radius: number, height: number, turns: number, pointsCount: number) => {
    const points = [];
    for (let i = 0; i < pointsCount; i++) {
      const angle = (i / pointsCount) * Math.PI * 2 * turns;
      const y = (i / pointsCount) * height - height / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  };

  // Create the strands
  const strand1Points = generateHelixPoints(1.2, height, 2, 100);
  const strand2Points = generateHelixPoints(1.2, height, 2, 100).map(point => {
    // Offset the second strand by half a turn
    const newPoint = point.clone();
    newPoint.x = -newPoint.x;
    newPoint.z = -newPoint.z;
    return newPoint;
  });

  return (
    <group ref={groupRef}>
      <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.1}>
        {/* DNA backbones (two helix strands) */}
        <group>
          {/* First strand */}
          <mesh>
            <tubeGeometry 
              args={[
                new THREE.CatmullRomCurve3(strand1Points),
                100, 0.15, 8, false
              ]}
            />
            <meshStandardMaterial 
              color="#4361ee" 
              emissive="#2f3ddf" 
              emissiveIntensity={0.3} 
              roughness={0.3} 
              metalness={0.7}
            />
          </mesh>
          
          {/* Second strand */}
          <mesh>
            <tubeGeometry 
              args={[
                new THREE.CatmullRomCurve3(strand2Points),
                100, 0.15, 8, false
              ]}
            />
            <meshStandardMaterial 
              color="#3f37c9" 
              emissive="#1a1464" 
              emissiveIntensity={0.3}
              roughness={0.3} 
              metalness={0.7}
            />
          </mesh>
          
          {/* Base pairs connecting the strands */}
          {Array.from({ length: pairsCount }).map((_, i) => {
            const y = i * spacing - height / 2 + spacing / 2;
            const angle = (i / pairsCount) * Math.PI * 2 * 2; // 2 full turns
            
            const x1 = Math.cos(angle) * 1.2;
            const z1 = Math.sin(angle) * 1.2;
            
            // Second point is on opposite side
            const x2 = -x1;
            const z2 = -z1;
            
            // Determine base type and color from sequence if available
            const baseType = sequence && i < sequence.length 
              ? sequence[i].toUpperCase() 
              : ['A', 'T', 'G', 'C'][i % 4];
            
            const baseColor = BASE_COLORS[baseType] || new THREE.Color('#ff0a54');
            
            // Check if this base is highlighted or edited
            const isHighlighted = highlightBases.includes(i);
            const isEdited = editPositions.includes(i);
            const isActive = activeBase === i;
            
            // Determine emission intensity based on state
            const emissiveIntensity = isEdited 
              ? 1.5 
              : isHighlighted 
                ? 1 
                : isActive 
                  ? 0.8 
                  : 0.3;
            
            return (
              <group key={i} position-y={y}>
                {/* First nucleotide */}
                <motion.group
                  position={[x1 * 0.6, 0, z1 * 0.6]}
                  scale={isEdited ? 1.3 : isHighlighted || isActive ? 1.2 : 1}
                  whileHover={{ scale: interactive ? 1.4 : 1 }}
                  animate={isEdited ? {
                    scale: [1.2, 1.4, 1.2],
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: isEdited ? Infinity : 0,
                    repeatType: "mirror"
                  }}
                >
                  <mesh 
                    onPointerOver={() => interactive && setActiveBase(i)}
                    onPointerOut={() => interactive && setActiveBase(null)}
                  >
                    <sphereGeometry args={[0.25, 24, 24]} />
                    <meshStandardMaterial 
                      color={baseColor} 
                      emissive={baseColor} 
                      emissiveIntensity={emissiveIntensity}
                      roughness={0.3} 
                      metalness={0.7}
                    />
                  </mesh>
                  
                  {/* Base label */}
                  {interactive && (isActive || isHighlighted || isEdited) && (
                    <Text
                      position={[0, 0.5, 0]}
                      fontSize={0.3}
                      color="white"
                      anchorX="center"
                      anchorY="middle"
                      font="/fonts/Inter-Bold.woff"
                    >
                      {baseType}
                    </Text>
                  )}
                </motion.group>
                
                {/* Second nucleotide */}
                <motion.group
                  position={[x2 * 0.6, 0, z2 * 0.6]}
                  scale={isEdited ? 1.3 : isHighlighted || isActive ? 1.2 : 1}
                  animate={isEdited ? {
                    scale: [1.2, 1.4, 1.2],
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: isEdited ? Infinity : 0,
                    repeatType: "mirror"
                  }}
                >
                  <mesh>
                    <sphereGeometry args={[0.25, 24, 24]} />
                    <meshStandardMaterial 
                      color={baseColor} 
                      emissive={baseColor} 
                      emissiveIntensity={emissiveIntensity}
                      roughness={0.3} 
                      metalness={0.7}
                    />
                  </mesh>
                </motion.group>
                
                {/* The connection between bases */}
                <mesh>
                  <cylinderGeometry 
                    args={[0.05, 0.05, Math.sqrt((x2-x1)**2 + (z2-z1)**2) * 1.2, 8]} 
                  />
                  <meshStandardMaterial 
                    color="#f8f9fa" 
                    transparent={true} 
                    opacity={0.8}
                    roughness={0.3} 
                    metalness={0.5}
                  />
                  <group position={[(x1 + x2) / 2 * 0.6, 0, (z1 + z2) / 2 * 0.6]}>
                    <mesh
                      rotation={[Math.PI / 2, 0, Math.atan2(z2 - z1, x2 - x1)]}
                    >
                      <cylinderGeometry args={[0.05, 0.05, 2.4, 8]} />
                      <meshStandardMaterial 
                        color="#f8f9fa" 
                        transparent={true} 
                        opacity={0.6}
                        roughness={0.3} 
                        metalness={0.5}
                      />
                    </mesh>
                  </group>
                </mesh>
              </group>
            );
          })}
        </group>
      </Float>
    </group>
  );
}

// Framer motion camera (advanced effects)
function AnimatedCamera() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  useFrame(({ clock }) => {
    if (cameraRef.current) {
      // Subtle camera movement for dynamic feel
      cameraRef.current.position.y = Math.sin(clock.elapsedTime * 0.3) * 0.5;
      cameraRef.current.position.x = Math.sin(clock.elapsedTime * 0.2) * 0.5;
    }
  });
  
  return (
    <PerspectiveCamera 
      ref={cameraRef}
      makeDefault 
      position={[0, 0, 10]} 
      fov={35}
    />
  );
}

interface DNAHelixProps {
  highlightedBases?: number[];
  editPositions?: number[];
  sequence?: string;
  interactive?: boolean;
}

export default function DNAHelix({
  highlightedBases = [],
  editPositions = [],
  sequence = '',
  interactive = true
}: DNAHelixProps) {
  // Sample random highlighted bases for demo effect
  const [activeHighlights, setActiveHighlights] = useState<number[]>(highlightedBases);
  const [animateIn, setAnimateIn] = useState(false);
  
  // Update highlighted bases periodically for demo effect if no highlights provided
  useEffect(() => {
    if (highlightedBases.length === 0 && !editPositions.length) {
      const interval = setInterval(() => {
        const randomBases = Array.from({ length: 3 }, () => 
          Math.floor(Math.random() * 20)
        );
        setActiveHighlights(randomBases);
      }, 5000);
      
      return () => clearInterval(interval);
    } else {
      setActiveHighlights(highlightedBases);
    }
  }, [highlightedBases, editPositions]);
  
  // Animation in effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <MotionConfig reducedMotion="user">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full h-full rounded-lg overflow-hidden"
      >
        <Canvas>
          <color attach="background" args={['#00000000']} />
          
          {/* Scene lighting */}
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#3a86ff" />
          <pointLight position={[0, 5, 0]} intensity={0.5} color="#ff006e" />
          
          {/* Animated camera */}
          <AnimatedCamera />
          
          {/* DNA Strand */}
          <motion.group
            initial={{ scale: 0, rotateX: 180 }}
            animate={{ 
              scale: animateIn ? 1 : 0,
              rotateX: animateIn ? 0 : 180
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: 0.3
            }}
          >
            <DNAStrand 
              highlightBases={activeHighlights} 
              editPositions={editPositions}
              sequence={sequence}
              interactive={interactive}
            />
          </motion.group>
          
          {/* Particle effects */}
          <Sparkles 
            count={80}
            scale={12}
            size={1}
            speed={0.3}
            opacity={0.5}
            color="#4361ee"
          />
          
          {/* Additional particles for edited positions */}
          {editPositions.length > 0 && (
            <Sparkles 
              count={30}
              scale={6}
              size={2}
              speed={0.5}
              opacity={0.7}
              color="#ff006e"
              position-y={editPositions.length > 0 
                ? (editPositions[0] * (10 / (sequence.length || 20))) - 5 
                : 0
              }
            />
          )}
          
          {/* Environment map for reflections */}
          <Environment preset="city" />
        </Canvas>
        
        {/* Controls overlay */}
        {interactive && (
          <div className="absolute bottom-3 right-3 text-xs text-white opacity-60">
            <p>Hover over bases to inspect</p>
          </div>
        )}
      </motion.div>
    </MotionConfig>
  );
} 