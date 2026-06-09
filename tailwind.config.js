/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#080810',
          secondary: '#0e0e1a',
          card: 'rgba(255,255,255,0.04)',
        },
        neon: {
          purple: '#a855f7',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          green: '#22c55e',
          red: '#ef4444',
          orange: '#f97316',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        glass: '20px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'glow-green': 'glowGreen 2s ease-in-out infinite',
        'glow-red': 'glowRed 2s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        glowGreen: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34,197,94,0.4), 0 0 60px rgba(34,197,94,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(34,197,94,0.8), 0 0 100px rgba(34,197,94,0.4)' },
        },
        glowRed: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(239,68,68,0.4), 0 0 60px rgba(239,68,68,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(239,68,68,0.8), 0 0 100px rgba(239,68,68,0.4)' },
        },
      },
    },
  },
  plugins: [],
}
