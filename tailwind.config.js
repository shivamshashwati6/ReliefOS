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
        command: {
          bg: '#070b12',
          surface: '#0d131f',
          card: '#111927',
          cardHover: '#152135',
          border: '#1f2c42',
          borderSubtle: '#182337',
          highlight: '#20324e',
          textMuted: '#8295b5',
          textDim: '#4f6280',
        },
        emergency: {
          critical: '#ef4444',
          criticalBg: 'rgba(239, 68, 68, 0.12)',
          criticalBorder: 'rgba(239, 68, 68, 0.35)',
          high: '#f97316',
          highBg: 'rgba(249, 115, 22, 0.12)',
          highBorder: 'rgba(249, 115, 22, 0.35)',
          medium: '#eab308',
          mediumBg: 'rgba(234, 179, 8, 0.12)',
          mediumBorder: 'rgba(234, 179, 8, 0.35)',
          low: '#10b981',
          lowBg: 'rgba(16, 185, 129, 0.12)',
          lowBorder: 'rgba(16, 185, 129, 0.35)',
          info: '#3b82f6',
          infoBg: 'rgba(59, 130, 246, 0.12)',
          infoBorder: 'rgba(59, 130, 246, 0.35)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
