'use client'

import { useCallback } from 'react'
import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import type { Engine, ISourceOptions } from "tsparticles-engine"

// Enhanced DNA-themed particle configuration for modern UI
const particlesConfig: ISourceOptions = {
  background: {
    color: {
      value: "transparent",
    },
  },
  fullScreen: {
    enable: true,
    zIndex: -1
  },
  fpsLimit: 120,
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "grab",
        parallax: {
          enable: true,
          force: 20,
          smooth: 50
        }
      },
    },
    modes: {
      grab: {
        distance: 150,
        links: {
          opacity: 0.2
        }
      }
    }
  },
  particles: {
    color: {
      value: ["#4361ee", "#3f37c9", "#5a67d8", "#3a86ff"],
    },
    links: {
      color: "#ffffff",
      distance: 150,
      enable: true,
      opacity: 0.15,
      width: 0.8,
      triangles: {
        enable: true,
        opacity: 0.05
      }
    },
    move: {
      direction: "none",
      enable: true,
      outMode: "out",
      random: true,
      speed: 0.3,
      straight: false,
      path: {
        enable: true,
        delay: {
          value: 0.1
        },
        options: {
          size: 5,
          draw: false,
          increment: 0.001
        }
      },
      trail: {
        enable: true,
        length: 3,
        fill: {
          color: "#000"
        }
      }
    },
    number: {
      density: {
        enable: true,
        area: 1000,
      },
      value: 60,
    },
    opacity: {
      value: { min: 0.1, max: 0.3 },
      animation: {
        enable: true,
        speed: 0.2,
        sync: false
      }
    },
    shape: {
      type: ["circle", "triangle"],
    },
    size: {
      value: { min: 1, max: 2.5 },
      animation: {
        enable: true,
        speed: 0.2,
        sync: false
      }
    },
    blur: {
      value: 1
    }
  },
  detectRetina: true,
}

export default function ParticleBackground() {
  const particlesInit = useCallback(async (engine: Engine) => {
    // Load the slim version of tsParticles
    await loadSlim(engine)
  }, [])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={particlesConfig}
        className="absolute inset-0"
      />
    </div>
  )
} 