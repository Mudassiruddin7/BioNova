// Color palette for the ChainSight components
export const DNA_COLORS = {
  primary: '#00CCFF',  // Vivid cyan
  secondary: '#B16CEA',  // Bright purple
  tertiary: '#FF4D6E',  // Coral pink
  accent: '#4F46E5',  // Indigo
  status: {
    success: '#16A34A',  // Green
    warning: '#F59E0B',  // Amber
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    muted: '#64748B'
  }
};

export const GENOMIC_THEME = {
  primary: '#4F46E5',
  secondary: '#B16CEA',
  accent: '#00CCFF',
  background: {
    dark: '#060620',
    light: '#F8FAFC'
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    muted: '#64748B'
  }
};

// Shadows and glows for UI elements
export const EFFECTS = {
  glassMorphism: {
    background: "rgba(8, 8, 40, 0.7)",
    backdropFilter: "blur(10px)",
    border: `1px solid rgba(255, 255, 255, 0.1)`,
  },
  shadows: {
    small: "0 2px 10px rgba(0, 0, 0, 0.2)",
    medium: "0 4px 20px rgba(0, 0, 0, 0.25)",
    large: "0 10px 30px rgba(0, 0, 0, 0.3)",
  },
  glows: {
    cyan: `0 0 15px rgba(0, 255, 255, 0.5)`,
    magenta: `0 0 15px rgba(255, 0, 255, 0.5)`,
    green: `0 0 15px rgba(0, 255, 127, 0.5)`,
  },
};

// Animation presets
export const ANIMATIONS = {
  transitions: {
    fast: { duration: 0.2, ease: "easeOut" },
    medium: { duration: 0.5, ease: "easeOut" },
    slow: { duration: 0.8, ease: "easeInOut" },
  },
  hover: {
    grow: { scale: 1.05 },
    glow: (color: string) => ({ boxShadow: `0 0 15px ${color}` }),
    float: { y: -5 },
  },
};

// Responsive breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

// Z-index layers
export const Z_LAYERS = {
  background: -10,
  content: 10,
  overlay: 20,
  modal: 30,
  tooltip: 40,
  highest: 50,
}; 