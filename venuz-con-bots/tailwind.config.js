/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './app/**/*.{ts,tsx,js,jsx}',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Casino palette
        'neon-purple': '#bf00ff',
        'hot-magenta': '#ff006e',
        'electric-cyan': '#00f0ff',
        'alert-orange': '#ff6b00',
        'deep-black': '#0a0a0f',
        'casino-gold': '#ffd700',

        // Gradient stops
        'gradient-start': '#bf00ff',
        'gradient-middle': '#ff006e',
        'gradient-end': '#ff6b00',

        // Mantener venuz colors para compatibilidad si es necesario
        venuz: {
          black: '#0a0a0a',
          charcoal: '#1a1a1a',
          gray: '#2a2a2a',
          pink: '#ff1493',
          'pink-dark': '#c7107a',
          gold: '#ffd700',
          'gold-dark': '#b8941e',
          red: '#dc143c',
          'red-dark': '#a0102a',
        },
      },
      fontFamily: {
        display: ['Exo 2', 'Orbitron', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        accent: ['Righteous', 'cursive'],
      },
      animation: {
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'heartbeat': 'heartbeat 0.6s ease-in-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-in',
        'casino-spin': 'casino-spin 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 10px rgba(191, 0, 255, 0.5), 0 0 20px rgba(191, 0, 255, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(191, 0, 255, 0.8), 0 0 40px rgba(191, 0, 255, 0.5), 0 0 60px rgba(191, 0, 255, 0.3)',
          },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'heartbeat': {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.2)' },
          '50%': { transform: 'scale(1)' },
          '75%': { transform: 'scale(1.1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'casino-spin': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.1)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
      },
      backgroundImage: {
        'gradient-casino': 'linear-gradient(135deg, #bf00ff 0%, #ff006e 50%, #ff6b00 100%)',
        'gradient-glow': 'radial-gradient(circle, rgba(191,0,255,0.3) 0%, transparent 70%)',
        'gradient-shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
      },
    },
  },
  plugins: [],
}
