/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        dna: {
          cyan: "#00FFFF",
          magenta: "#FF00FF",
          green: "#00FF7F",
          indigo: "#4B0082",
        },
        background: {
          dark: "#080828",
          darker: "#05051A",
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 255, 255, 0.5)',
        'glow-magenta': '0 0 15px rgba(255, 0, 255, 0.5)',
        'glow-green': '0 0 15px rgba(0, 255, 127, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(8px)',
      },
      perspective: {
        '1000': '1000px',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.perspective-1000': {
          perspective: '1000px',
        },
        '.preserve-3d': {
          transformStyle: 'preserve-3d',
        },
        '.backdrop-blur-sm': {
          backdropFilter: 'blur(4px)',
        },
        '.backdrop-blur-md': {
          backdropFilter: 'blur(8px)',
        },
        '.backdrop-blur-lg': {
          backdropFilter: 'blur(12px)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
}; 