"use client";

import { useCallback, useState, useEffect, useMemo, memo } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine, ISourceOptions } from "tsparticles-engine";
import { motion } from "framer-motion";

const BackgroundParticlesComponent = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const particlesInit = useCallback(async (engine: Engine) => {
    // Use loadSlim instead of loadFull for better performance
    await loadSlim(engine);
  }, []);

  // Memoize options to prevent recreating this object on each render
  const options: ISourceOptions = useMemo(() => ({
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: {
        value: isMobile ? 30 : 80,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: ["#00FFFF", "#FF00FF", "#00FF7F", "#6366F1", "#4F46E5", "#B16CEA"],
      },
      shape: {
        type: ["circle", "triangle", "polygon"],
        polygon: {
          sides: 6
        },
      },
      opacity: {
        value: { min: 0.1, max: 0.5 },
        animation: {
          enable: true,
          speed: 1,
          minimumValue: 0.1,
          sync: false
        }
      },
      size: {
        value: { min: 1, max: 4 },
        animation: {
          enable: true,
          speed: 2,
          minimumValue: 0.5,
          sync: false
        }
      },
      links: {
        enable: true,
        distance: 150,
        color: "#4F46E5",
        opacity: 0.2,
        width: 1,
        triangles: {
          enable: true,
          color: "#B16CEA",
          opacity: 0.05
        }
      },
      move: {
        enable: true,
        speed: 1,
        direction: "none",
        random: true,
        straight: false,
        outMode: "out",
        attract: {
          enable: true,
          rotateX: 600,
          rotateY: 1200
        },
        trail: {
          enable: true,
          length: 5,
          fillColor: "#000814"
        }
      }
    },
    interactivity: {
      detectsOn: "canvas",
      events: {
        onHover: {
          enable: true,
          mode: "grab"
        },
        onClick: {
          enable: true,
          mode: "push"
        },
        resize: true
      },
      modes: {
        grab: {
          distance: 150,
          links: {
            opacity: 0.5,
            color: "#00FFFF"
          }
        },
        push: {
          quantity: 4
        },
        repulse: {
          distance: 100,
          duration: 0.4
        }
      }
    },
    background: {
      color: "transparent"
    },
    themes: [
      {
        name: "dna",
        default: {
          value: true,
          mode: "dark"
        },
        options: {
          particles: {
            move: {
              speed: 1.5
            }
          }
        }
      }
    ],
    emitters: [
      {
        direction: "top",
        rate: {
          delay: 2,
          quantity: 1
        },
        position: {
          x: 0,
          y: 100
        },
        size: {
          width: 100,
          height: 0
        },
        particles: {
          color: {
            value: "#00FFFF"
          },
          move: {
            direction: "top",
            outMode: {
              top: "none",
              left: "none",
              right: "none",
              bottom: "destroy",
              default: "none"
            }
          }
        }
      },
      {
        direction: "top",
        rate: {
          delay: 2,
          quantity: 1
        },
        position: {
          x: 100,
          y: 100
        },
        size: {
          width: 100,
          height: 0
        },
        particles: {
          color: {
            value: "#FF00FF"
          },
          move: {
            direction: "top",
            outMode: {
              top: "none",
              left: "none",
              right: "none",
              bottom: "destroy",
              default: "none"
            }
          }
        }
      }
    ],
    detectRetina: true,
  }), [isMobile]);

  return (
    <motion.div 
      className="absolute inset-0 -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-indigo-900/10 via-transparent to-transparent opacity-50"></div>
      
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={options}
        className="absolute inset-0"
      />
      
      {/* DNA Helix glow effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/2 translate-x-1/2 w-[500px] h-[500px] rounded-full bg-fuchsia-600/10 blur-[100px]"></div>
      </motion.div>
    </motion.div>
  );
};

// Wrap component with memo to prevent unnecessary re-renders
export const BackgroundParticles = memo(BackgroundParticlesComponent); 