'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CellularBackgroundProps {
  intensity?: 'low' | 'medium' | 'high';
  color?: 'blue' | 'purple' | 'cyan' | 'mixed';
}

export default function CellularBackground({ 
  intensity = 'medium',
  color = 'mixed'
}: CellularBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Cell count based on intensity
  const getCellCount = () => {
    switch (intensity) {
      case 'low': return 30;
      case 'high': return 80;
      case 'medium':
      default: return 50;
    }
  };
  
  // Color schemes
  const getColorScheme = () => {
    switch (color) {
      case 'blue':
        return [
          'rgba(58, 134, 255, 0.6)', // Blue
          'rgba(58, 134, 255, 0.4)', // Light Blue
          'rgba(58, 134, 255, 0.5)', // Medium Blue
        ];
      case 'purple':
        return [
          'rgba(99, 102, 241, 0.6)', // Indigo/Purple
          'rgba(139, 92, 246, 0.5)', // Purple
          'rgba(124, 58, 237, 0.4)', // Violet
        ];
      case 'cyan':
        return [
          'rgba(56, 189, 248, 0.6)', // Cyan
          'rgba(14, 165, 233, 0.5)', // Light Cyan
          'rgba(6, 182, 212, 0.4)', // Teal
        ];
      case 'mixed':
      default:
        return [
          'rgba(67, 97, 238, 0.6)',  // Indigo
          'rgba(58, 134, 255, 0.6)', // Blue
          'rgba(56, 189, 248, 0.6)', // Cyan
          'rgba(99, 102, 241, 0.6)', // Indigo/Purple
        ];
    }
  };
  
  // Create cellular background animation
  const drawCellularBackground = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match window with pixel ratio for retina displays
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    
    // Scale the context to account for the device pixel ratio
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Set canvas CSS size
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Cell properties
    const cellCount = getCellCount();
    const colorScheme = getColorScheme();
    
    const cells: {
      x: number;
      y: number;
      size: number;
      opacity: number;
      speed: number;
      color: string;
      pulseSpeed: number;
      rotation: number;
      rotationSpeed: number;
    }[] = [];

    // Generate cells
    for (let i = 0; i < cellCount; i++) {
      cells.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 60 + 20,
        opacity: Math.random() * 0.15 + 0.05,
        speed: Math.random() * 0.2 + 0.05,
        color: colorScheme[Math.floor(Math.random() * colorScheme.length)],
        pulseSpeed: Math.random() * 0.02 + 0.01,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() * 0.001 + 0.0005) * (Math.random() > 0.5 ? 1 : -1)
      });
    }

    // Animation loop
    let animationFrame: number;
    let lastTime = 0;
    
    function animate(timestamp: number) {
      // Calculate delta time for smooth animation regardless of frame rate
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      
      // Clear canvas
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      
      // Draw cells
      cells.forEach(cell => {
        // Update position with delta time
        cell.y -= cell.speed * (deltaTime / 16);
        cell.rotation += cell.rotationSpeed * (deltaTime / 16);
        
        // Calculate pulse effect (size oscillation)
        const pulse = Math.sin(timestamp * cell.pulseSpeed) * 0.1 + 1;
        
        // Reset if off screen
        if (cell.y + cell.size < 0) {
          cell.y = window.innerHeight + cell.size;
          cell.x = Math.random() * window.innerWidth;
        }
        
        // Draw cell (circular shape with gradient)
        const gradient = ctx.createRadialGradient(
          cell.x, cell.y, 0,
          cell.x, cell.y, cell.size * pulse
        );
        
        // Parse the rgba color
        const colorMatch = cell.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (colorMatch) {
          const [_, r, g, b, a] = colorMatch.map(Number);
          
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          
          // Save context state
          ctx.save();
          
          // Translate and rotate for non-circular cells
          ctx.translate(cell.x, cell.y);
          ctx.rotate(cell.rotation);
          
          // Draw ellipse instead of circle for more organic feel
          ctx.beginPath();
          ctx.ellipse(0, 0, cell.size * pulse, cell.size * pulse * 0.7, 0, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
          
          // Restore context
          ctx.restore();
        }
      });
      
      // Draw the grid pattern
      const gridSize = 40;
      ctx.strokeStyle = 'rgba(75, 85, 99, 0.1)'; // Gray-500 with low opacity
      ctx.lineWidth = 0.5;
      
      // Vertical lines
      for (let x = 0; x < window.innerWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, window.innerHeight);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y < window.innerHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(window.innerWidth, y);
        ctx.stroke();
      }

      animationFrame = requestAnimationFrame(animate);
    }

    animationFrame = requestAnimationFrame(animate);
    
    // Handle resize
    const handleResize = () => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      
      // Scale the context to account for the device pixel ratio
      ctx.scale(devicePixelRatio, devicePixelRatio);
      
      // Update canvas CSS size
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrame);
    };
  }, [intensity, color]);
  
  useEffect(() => {
    setIsVisible(true);
    const cleanup = drawCellularBackground();
    return cleanup;
  }, [drawCellularBackground]);
  
  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full z-0"
      />
      
      {/* Additional overlay effects */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-transparent to-gray-950/80 z-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 1.5 }}
      />
      
      {/* Subtle scanline effect */}
      <div className="absolute inset-0 bg-[url('/scanlines.svg')] bg-repeat opacity-[0.02] z-1 pointer-events-none"></div>
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-radial-gradient z-1 pointer-events-none"></div>
      
      {/* Glow points */}
      <div className="absolute left-1/4 top-1/4 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none z-1"></div>
      <div className="absolute right-1/4 bottom-1/3 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none z-1"></div>
    </>
  );
} 