/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          bg: '#0a0d14',
          surface: '#111726',
          card: '#161e31',
          border: '#24304c',
          accent: '#00f2fe',
          neonPink: '#ff007f',
          neonPurple: '#9d4edd',
          neonGreen: '#00ff88',
          neonAmber: '#ffb703',
          muted: '#6b7c96',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave-flow': 'waveFlow 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 10px rgba(0, 242, 254, 0.6))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 4px rgba(0, 242, 254, 0.2))' },
        },
        waveFlow: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.3)' },
        }
      }
    },
  },
  plugins: [],
}
