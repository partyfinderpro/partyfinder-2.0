/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
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
        // Paleta Dark Casino VIP (Nuevo)
        vip: {
          black: "#050505", // Negro casi absoluto
          gold: "#bf953f", // Oro base
          goldLight: "#fcf6ba", // Oro brillo
          goldDark: "#aa771c", // Oro sombra
          purple: "#240046", // Púrpura profundo fondo
          purpleNeon: "#7b2cbf", // Púrpura neón acentos
          magenta: "#f72585", // Magenta neón vibrante
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Montserrat', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gold-gradient': 'linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)',
        'radial-vignette': 'radial-gradient(circle farthest-corner at center center, transparent 0%, rgba(0,0,0,0.9) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shine': 'shine 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shine: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
    },
  },
  plugins: [],
}
