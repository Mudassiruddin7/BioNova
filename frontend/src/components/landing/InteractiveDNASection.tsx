'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion'

// Define DNA base pair types
type BasePair = 'A' | 'T' | 'G' | 'C'

// Interactive DNA Facts for the info panel
const dnaFacts = [
  "DNA (deoxyribonucleic acid) is the genetic material in humans and almost all other organisms.",
  "If uncoiled, the DNA in a single human cell would stretch about 2 meters long.",
  "Human DNA is 99.9% identical from person to person.",
  "CRISPR technology allows scientists to edit genes by precisely cutting DNA and letting natural repair processes take over.",
  "A genome is an organism's complete set of DNA, including all of its genes.",
  "There are approximately 3 billion base pairs in human DNA."
]

// BasePair component with tooltip on hover
function BasePairComponent({ 
  base, 
  index, 
  isTargeted = false,
  position,
  delay,
  linkedWith,
  onBaseClick,
  zIndex
}: { 
  base: BasePair
  index: number
  isTargeted?: boolean
  position: { x: number, y: number, rotation: number }
  delay: number
  linkedWith: number[] // Indices of bases this is linked with
  onBaseClick: (index: number) => void
  zIndex: number
}) {
  // --- Restoring internal logic ---
  const [isHovered, setIsHovered] = useState(false)
  const controls = useAnimation()
  
  // Base pair colors with enhanced gradients
  const baseColors = {
    'A': 'bg-gradient-to-br from-red-400 to-red-600',
    'T': 'bg-gradient-to-br from-blue-400 to-blue-600',
    'G': 'bg-gradient-to-br from-green-400 to-green-600',
    'C': 'bg-gradient-to-br from-yellow-400 to-yellow-600'
  }
  
  // Base pair inner ring colors
  const baseInnerRings = {
    'A': 'border-red-300',
    'T': 'border-blue-300',
    'G': 'border-green-300',
    'C': 'border-yellow-300'
  }
  
  // Base pair complementary pairs
  const complementaryBase = {
    'A': 'T',
    'T': 'A',
    'G': 'C',
    'C': 'G'
  }
  
  // Base pair descriptions
  const baseDescriptions = {
    'A': 'Adenine',
    'T': 'Thymine',
    'G': 'Guanine',
    'C': 'Cytosine'
  }

  // Base functions
  const baseFunctions = {
    'A': 'Forms base pair with Thymine (T) via two hydrogen bonds',
    'T': 'Forms base pair with Adenine (A) via two hydrogen bonds',
    'G': 'Forms base pair with Cytosine (C) via three hydrogen bonds',
    'C': 'Forms base pair with Guanine (G) via three hydrogen bonds'
  }

  // Shadow and glow effects for different bases
  const baseEffects = {
    'A': 'shadow-lg shadow-red-500/30',
    'T': 'shadow-lg shadow-blue-500/30',
    'G': 'shadow-lg shadow-green-500/30',
    'C': 'shadow-lg shadow-yellow-500/30'
  }

  // Glow effects for highlights
  const baseGlows = {
    'A': 'after:bg-red-500/20',
    'T': 'after:bg-blue-500/20',
    'G': 'after:bg-green-500/20',
    'C': 'after:bg-yellow-500/20'
  }
  
  useEffect(() => {
    if (isTargeted) {
      controls.start({
        scale: [1, 1.1, 1],
        opacity: [1, 0.9, 1],
        transition: {
          repeat: Infinity,
          repeatType: "reverse",
          duration: 3,
          delay: delay * 0.4,
          ease: "easeInOut"
        }
      })
    } else {
      controls.start({
        scale: 1,
        opacity: 1
      })
    }
  }, [isTargeted, controls, delay])
  
  // --- Restoring Original Return --- 
  return (
    <motion.div 
      className="absolute"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        rotate: position.rotation,
        transformOrigin: "center center",
        zIndex: isHovered ? 50 : zIndex
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.8, 
        delay: delay * 0.1,
        type: "spring",
        stiffness: 80,
        damping: 12
      }}
    >
      <div 
        className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
        onClick={() => onBaseClick(index)}
    >
      <motion.div 
          className={`w-9 h-9 rounded-full ${baseColors[base]} flex items-center justify-center text-white text-sm font-bold cursor-pointer backdrop-blur-sm ${baseEffects[base]}
            ${isTargeted ? 'ring-2 ring-white/80 ring-opacity-70' : ''}
            border-2 ${baseInnerRings[base]} relative
            after:content-[''] after:absolute after:top-[-8px] after:left-[-8px] after:w-[calc(100%+16px)] after:h-[calc(100%+16px)] after:rounded-full ${baseGlows[base]} after:blur-xl after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300`}
          whileHover={{ scale: 1.3, rotate: 10 }}
          whileTap={{ scale: 0.95 }}
          animate={controls}
      >
        {base}
      </motion.div>
      
        {/* Connecting line - with animation */}
        <motion.div 
          className="absolute left-1/2 top-1/2 w-[45px] h-[2px] bg-gradient-to-r from-gray-400/80 via-gray-300/50 to-gray-400/80 origin-left rounded-full"
          style={{ transformOrigin: "left center" }}
          animate={{
            rotate: isHovered ? [0, -3, 3, 0] : 0,
            width: isHovered ? [45, 48, 45] : 45,
            opacity: isHovered ? [0.8, 1, 0.8] : 0.8
          }}
          transition={{
            duration: 1.5,
            repeat: isHovered ? Infinity : 0,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
      
      {/* Complementary base */}
      <motion.div 
          className={`absolute left-[40px] top-0 w-9 h-9 rounded-full ${baseColors[complementaryBase[base] as BasePair]} flex items-center justify-center text-white text-sm font-bold backdrop-blur-sm ${baseEffects[complementaryBase[base] as BasePair]} border-2 ${baseInnerRings[complementaryBase[base] as BasePair]}`}
          whileHover={{ scale: 1.3, rotate: -10 }}
          whileTap={{ scale: 0.95 }}
          animate={controls}
          transition={{ delay: 0.05 }}
      >
        {complementaryBase[base]}
      </motion.div>
      
        {/* Tooltip - now always horizontal regardless of DNA rotation */}
        <AnimatePresence>
      {isHovered && (
        <motion.div 
              className="fixed transform -translate-x-1/2 -translate-y-full glassmorphism text-white p-4 rounded-xl shadow-xl z-50 w-72 border border-indigo-500/30 backdrop-blur-lg"
              style={{
                left: `calc(${position.x}px + 20px)`,
                top: `${position.y - 20}px`,
                transform: 'translateX(-50%)'
              }}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-lg flex items-center">
                  <div className={`w-6 h-6 rounded-full ${baseColors[base]} mr-2 flex items-center justify-center text-xs shadow-md ${baseEffects[base]}`}>
                    {base}
                  </div>
                  {baseDescriptions[base]} ({base})
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-indigo-900/50 border border-indigo-500/30">
                  #{index + 1}
                </div>
              </div>
              
              <div className="text-sm mt-2 p-2 bg-white/5 rounded-lg">{baseFunctions[base]}</div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="text-xs flex items-center px-2 py-1 rounded-full bg-indigo-900/30 border border-indigo-500/20">
                  <span className={`inline-block w-3 h-3 rounded-full ${isTargeted ? 'bg-indigo-500 animate-pulse' : 'bg-gray-500'} mr-2`}></span>
            {isTargeted ? 'CRISPR Target Site' : 'Non-target region'}
          </div>
                
                {/* Display linked bases (still using empty linkedBases state) */}
                {linkedWith.length > 0 && (
                  <div className="text-xs px-2 py-1 rounded-full bg-indigo-900/30 border border-indigo-500/20">
                    Links: {linkedWith.map(i => i+1).join(', ')}
                  </div>
                )}
              </div>
              
              <div className="text-xs text-indigo-300 mt-3 text-right">
                Click to highlight this base
              </div>
              
              <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 glassmorphism rotate-45 border-r border-b border-indigo-500/30"></div>
        </motion.div>
      )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Connection line between non-paired bases
function ConnectionLine({ 
  start, 
  end,
  color = "#4f46e5",
  delay = 0,
  highlight = false
}: { 
  start: { x: number, y: number }
  end: { x: number, y: number }
  color?: string
  delay: number
  highlight?: boolean
}) {
  const lineLength = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  )
  
  const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI
  
  return (
    <motion.div
      className={`absolute opacity-30 pointer-events-none ${highlight ? 'z-10' : 'z-0'}`}
      style={{
        top: start.y + 18,
        left: start.x + 18,
        width: lineLength,
        height: 1.5,
        backgroundColor: highlight ? "#10B981" : color,
        transformOrigin: "left center",
        rotate: angle,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: highlight ? [0.6, 0.9, 0.6] : [0.2, 0.4, 0.2],
        height: highlight ? [2, 3, 2] : [1.5, 2, 1.5],
        boxShadow: highlight ? ["0 0 5px #10B981", "0 0 10px #10B981", "0 0 5px #10B981"] : "none"
      }}
      transition={{
        opacity: {
          delay: delay * 0.1 + 0.5,
          duration: highlight ? 2 : 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        },
        height: {
          delay: delay * 0.1 + 0.5,
          duration: highlight ? 2 : 3,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        },
        boxShadow: {
          delay: delay * 0.1 + 0.5,
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        },
        duration: 0.8,
        delay: delay * 0.1,
      }}
    />
  )
}

// Info panel component to display DNA facts
function InfoPanel({ factIndex }: { factIndex: number }) {
  return (
    <motion.div 
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 glassmorphism rounded-xl p-4 text-white text-sm max-w-md border border-indigo-500/30 z-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-indigo-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-0.5">
          <span className="text-xs font-bold">DNA</span>
        </div>
        <div>
          <h4 className="font-medium text-indigo-300 mb-1">DNA Fact #{factIndex + 1}</h4>
          <p className="text-gray-200">{dnaFacts[factIndex]}</p>
        </div>
    </div>
    </motion.div>
  )
}

// Decorative DNA element
function DecoElement({ position, color, delay, size }: { position: [number, number], color: string, delay: number, size: number }) {
  return (
    <motion.div 
      className="absolute opacity-20 pointer-events-none"
      style={{
        left: `${position[0]}%`,
        top: `${position[1]}%`,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: "50%"
      }}
      initial={{ scale: 0 }}
      animate={{ 
        scale: [0.8, 1.2, 0.8],
        opacity: [0.1, 0.3, 0.1]
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay: delay,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }}
    />
  )
}

export default function InteractiveDNASection() {
  // DNA sequence (example)
  const dnaSequence: BasePair[] = [
    'A', 'T', 'G', 'C', 'G', 'A', 'T', 'C', 'G', 'A', 
    'T', 'A', 'C', 'G', 'T', 'A', 'G', 'C', 'T', 'A',
    'G', 'C', 'T', 'A'
  ]
  
  // Mark some bases as CRISPR targets
  const targetedIndices = [3, 4, 5, 6, 7, 8]
  
  const sectionRef = useRef<HTMLDivElement>(null)
  const dnaRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 }) // Restored useInView
  const controls = useAnimation()
  
  // State for connections and positions
  const [connections, setConnections] = useState<Array<{from: number, to: number}>>([])
  const [positions, setPositions] = useState<Array<{x: number, y: number, rotation: number}>>([])
  const [linkedBases, setLinkedBases] = useState<Array<number[]>>([])
  const [selectedBase, setSelectedBase] = useState<number | null>(null)
  const [animationSpeed, setAnimationSpeed] = useState<number>(1)
  const [factIndex, setFactIndex] = useState<number>(0)
  
  // Calculate positions for the double helix visualization - now centered
  const calculateHelixPositions = () => {
    const positions = []
    const radius = 120
    const verticalSpacing = 28
    const turns = 1.5
    // Center offset
    const centerX = 250
    
    for (let i = 0; i < dnaSequence.length; i++) {
      const angle = (i / (dnaSequence.length - 1)) * Math.PI * 2 * turns
      const x = Math.cos(angle) * radius + centerX
      const y = i * verticalSpacing
      
      // Calculate rotation for smoother visual connectivity
      const rotation = (angle * 180 / Math.PI) + 90
      
      positions.push({ x, y, rotation })
    }
    
    return positions
  }
  
  // Calculate connections between bases - now pure function
  const calculateConnections = (positions: Array<{x: number, y: number, rotation: number}>) => {
    const newConnections: Array<{from: number, to: number}> = []
    
    // Only run if positions are available
    if (positions.length === 0) return newConnections
    
    // Create a deterministic seed for connections to avoid changes on re-render
    const seed = 12345
    
    for (let i = 0; i < dnaSequence.length; i++) {
      const angle = (i / (dnaSequence.length - 1)) * Math.PI * 2 * 1.5
      
      for (let j = 0; j < i; j++) {
        const jAngle = (j / (dnaSequence.length - 1)) * Math.PI * 2 * 1.5
        
        // Use deterministic approach instead of Math.random
        // to determine which connections to create
        const shouldConnect = (i * 31 + j * 17 + seed) % 100 > 60 &&
                             Math.abs((angle % (Math.PI * 2)) - (jAngle % (Math.PI * 2))) < 0.3 && 
                             i - j > 3 && 
                             i - j < 10
                             
        if (shouldConnect) {
          newConnections.push({ from: i, to: j })
        }
      }
    }
    
    return newConnections
  }
  
  // Filter connections related to selected base
  const highlightedConnections = useMemo(() => {
    if (selectedBase === null) return []
    
    return connections.filter(conn => 
      conn.from === selectedBase || conn.to === selectedBase
    )
  }, [connections, selectedBase])
  
  // Handle base click to highlight connections
  const handleBaseClick = (index: number) => {
    if (selectedBase === index) {
      setSelectedBase(null)
    } else {
      setSelectedBase(index)
    }
  }
  
  // Initialize positions and connections once - Restoring this hook
  useEffect(() => {
    const newPositions = calculateHelixPositions()
    setPositions(newPositions)
    
    const newConnections = calculateConnections(newPositions)
    setConnections(newConnections)
  }, [dnaSequence.length]) // Only recalculate if DNA length changes
  
  // Update linked bases when connections change - Keeping this commented out
  // useEffect(() => {
  //   const newLinkedBases = dnaSequence.map((_, i) => {
  //     const linked: number[] = []
  //     connections.forEach(conn => {
  //       if (conn.from === i) linked.push(conn.to)
  //       if (conn.to === i) linked.push(conn.from)
  //     })
  //     return linked
  //   })
    
  //   setLinkedBases(newLinkedBases)
  // }, [connections, dnaSequence])
  
  // Handle animation controls based on view state // Restored useEffect
  useEffect(() => {
    if (isInView) {
      controls.start({
        opacity: 1,
        y: 0,
        transition: {
          duration: 1.2,
          ease: "easeOut"
        }
      })
    } else {
      controls.start({
        opacity: 0,
        y: 80,
        transition: {
          duration: 0.8
        }
      })
    }
  }, [isInView, controls])
  
  // Rotate through facts every 8 seconds - Uncommented for testing
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex(prev => (prev + 1) % dnaFacts.length)
    }, 8000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Animation for gentle floating movement of the entire DNA structure
  const floatingAnimation = {
    y: [0, -8, 0, 8, 0],
    rotate: [0, 0.3, 0, -0.3, 0],
    transition: {
      duration: 15 / animationSpeed,
      repeat: Infinity,
      ease: [0.45, 0.05, 0.55, 0.95]
    }
  }
  
  // Regular connections (not highlighted)
  const regularConnections = useMemo(() => {
    if (selectedBase === null) return connections
    return connections.filter(conn => 
      conn.from !== selectedBase && conn.to !== selectedBase
    )
  }, [connections, selectedBase])
  
  // Decorative elements for the background - random positions
  const decorElements = useMemo(() => {
    // Explicitly type the elements array
    const elements: Array<{ position: [number, number], color: string, delay: number, size: number }> = []
    const colors = ['#4361ee', '#3a86ff', '#ff0a54', '#10B981']
    
    for (let i = 0; i < 12; i++) {
      elements.push({
        position: [Math.random() * 100, Math.random() * 100],
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
        size: 4 + Math.random() * 8
      })
    }
    
    return elements
  }, [])
  
  return (
    <section 
      ref={sectionRef}
      className="relative py-24 bg-gradient-to-b from-indigo-950 to-gray-900 overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent opacity-50" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      
      {/* Subtle glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-900/10 blur-3xl" />
      
      {/* Decorative background elements - Restored */}
      {decorElements.map((elem, i) => (
        <DecoElement 
          key={`deco-${i}`}
          position={elem.position}
          color={elem.color}
          delay={elem.delay}
          size={elem.size}
        />
      ))}
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={controls} // Restored controls
          className="text-center mb-10"
        >
          <h2 className="text-4xl font-bold text-white mb-4 inline-block relative">
            Interactive DNA
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
            Hover over the DNA bases below to reveal genetic information and CRISPR target sites
          </p>
          
          {/* Animation controls */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex flex-col items-center">
              <label className="text-xs text-gray-400 mb-1">Animation Speed</label>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setAnimationSpeed(prev => Math.max(0.5, prev - 0.5))}
                  className="w-6 h-6 bg-indigo-800/50 rounded-full flex items-center justify-center text-white hover:bg-indigo-700/50 transition-colors"
                >-</button>
                <div className="w-24 h-1.5 bg-indigo-900/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: `${(animationSpeed / 2) * 100}%` }}
                  ></div>
                </div>
                <button 
                  onClick={() => setAnimationSpeed(prev => Math.min(2, prev + 0.5))}
                  className="w-6 h-6 bg-indigo-800/50 rounded-full flex items-center justify-center text-white hover:bg-indigo-700/50 transition-colors"
                >+</button>
              </div>
            </div>
            
            {selectedBase !== null && (
              <div className="ml-4 text-xs text-gray-300 bg-indigo-800/30 px-3 py-1.5 rounded-full flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500/60 rounded-full mr-2 animate-pulse"></span>
                <span className="font-semibold">Base #{selectedBase + 1}</span> selected
                <button 
                  onClick={() => setSelectedBase(null)}
                  className="ml-2 text-red-400 hover:text-red-300"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </motion.div>
        
        <div className="flex flex-wrap">
          {/* Main DNA visualization - now centered in a flex container */}
          <div className="w-full flex justify-center items-center">
        <motion.div
              ref={dnaRef}
              className="relative h-[600px] mx-auto"
              style={{ width: '600px' }}
          initial={{ opacity: 0 }}
              animate={{ opacity: 1, ...floatingAnimation }} // Restored floating animation
              transition={{ duration: 1, delay: 0.3 }}
            >
              {/* DNA Backbone Strand - left side with improved gradient */}
              <motion.div 
                className="absolute left-1/2 top-0 h-full w-2 bg-gradient-to-b from-indigo-600/40 via-indigo-400/30 to-indigo-600/40 rounded-full blur-[0.5px]"
                animate={{ // Restored backbone animation
                  x: [-30, -25, -30, -35, -30],
                  filter: ["blur(0.5px)", "blur(1px)", "blur(0.5px)"],
                  opacity: [0.8, 0.7, 0.8],
                  transition: {
                    duration: 12 / animationSpeed,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.25, 0.5, 0.75, 1]
                  }
                }}
              />
              
              {/* DNA Backbone Strand - right side with improved gradient */}
              <motion.div 
                className="absolute left-1/2 top-0 h-full w-2 bg-gradient-to-b from-indigo-600/40 via-indigo-400/30 to-indigo-600/40 rounded-full blur-[0.5px]"
                animate={{ // Restored backbone animation
                  x: [30, 35, 30, 25, 30],
                  filter: ["blur(0.5px)", "blur(1px)", "blur(0.5px)"],
                  opacity: [0.8, 0.7, 0.8],
                  transition: {
                    duration: 12 / animationSpeed,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.25, 0.5, 0.75, 1]
                  }
                }}
              />
              
              {/* Regular connection lines - Restored */}
              {regularConnections.map((conn, i) => (
                <ConnectionLine 
                  key={`conn-${i}`}
                  start={positions[conn.from] || {x: 0, y: 0}} 
                  end={positions[conn.to] || {x: 0, y: 0}}
                  delay={i}
                  color={
                    targetedIndices.includes(conn.from) || targetedIndices.includes(conn.to)
                      ? "#818cf8" // Indigo color for targeted connections
                      : "#4f46e5" // Default color
                  }
                />
              ))}
              
              {/* Highlighted connection lines - Restored */}
              {highlightedConnections.map((conn, i) => (
                <ConnectionLine 
                  key={`highlight-conn-${i}`}
                  start={positions[conn.from] || {x: 0, y: 0}} 
                  end={positions[conn.to] || {x: 0, y: 0}}
                  delay={i}
                  highlight={true}
                />
              ))}
              
              {/* DNA Bases - Restored (using simplified component) */}
              {positions.map((position, index) => (
                dnaSequence[index] && (
                  <BasePairComponent 
                key={index}
                    base={dnaSequence[index]} 
                  index={index} 
                  isTargeted={targetedIndices.includes(index)}
                    position={position}
                    delay={index * 0.1}
                    linkedWith={linkedBases[index] || []} // Note: linkedBases will be empty
                    onBaseClick={handleBaseClick}
                    zIndex={dnaSequence.length - index} // Higher bases get higher z-index
                  />
                )
              ))}
              
              {/* Small info labels for target sites - Restored */}
              {targetedIndices.map((index) => {
                const position = positions[index]
                if (!position) return null
                
                return (
                  <motion.div
                    key={`label-${index}`}
                    className="absolute text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600/60 text-white z-10 whitespace-nowrap"
                    style={{
                      left: position.x - 55,
                      top: position.y - 10,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                  >
                    CRISPR Target
                  </motion.div>
                )
              })}
              </motion.div>
          </div>
        </div>
          
        {/* Rotating info panel - Restored */}
        <AnimatePresence mode="wait">
          <InfoPanel key={factIndex} factIndex={factIndex} />
        </AnimatePresence>
        
        {/* Selected base info */}
        {selectedBase !== null && (
          <motion.div
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 glassmorphism px-4 py-2 rounded-lg text-xs text-white opacity-80 z-20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.8, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            Showing connections for base #{selectedBase + 1}
        </motion.div>
        )}
      </div>
    </section>
  )
} 