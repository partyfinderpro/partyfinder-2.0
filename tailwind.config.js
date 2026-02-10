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
        // ⚠️ PALETA VIP ACTIVADA - Dorado/Morado Premium
        venuz: {
          black: '#050505',       // Negro absoluto (era #0a0a0a)
          charcoal: '#1a1a1a',
          gray: '#2a2a2a',
          pink: '#bf953f',        // CAMBIADO: Era rosa, ahora ORO BASE
          'pink-dark': '#aa771c', // CAMBIADO: Era rosa oscuro, ahora ORO OSCURO
          gold: '#bf953f',        // Oro base
          'gold-dark': '#aa771c', // Oro sombra
          red: '#f72585',         // CAMBIADO: Ahora magenta neón
          'red-dark': '#7b2cbf',  // CAMBIADO: Ahora púrpura neón
        },
        // Paleta VIP Premium (NUEVA - Activada)
        vip: {
          black: "#050505",       // Negro casi absoluto
          gold: "#bf953f",        // Oro base
          goldLight: "#fcf6ba",   // Oro brillo
          goldDark: "#aa771c",    // Oro sombra
          purple: "#240046",      // Púrpura profundo fondo
          purpleNeon: "#7b2cbf",  // Púrpura neón acentos
          magenta: "#f72585",     // Magenta neón vibrante
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Montserrat', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #fcf6ba 0%, #bf953f 40%, #aa771c 100%)',
        'purple-gradient': 'linear-gradient(135deg, #7b2cbf 0%, #240046 100%)',
      },
      animation: {
        shine: 'shine 3s linear infinite',
        float: 'float 6s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        shine: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(191, 149, 63, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(191, 149, 63, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
