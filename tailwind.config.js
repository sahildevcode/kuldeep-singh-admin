/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        artisan: {
          bg: '#FDFBF7',         // Warm gallery white
          surface: '#FFFFFF',    // Crisp canvas white
          muted: '#F4EFEA',      // Soft linen tone
          charcoal: '#1A1816',   // Deep velvety charcoal for typography
          ink: '#0F0E0D',        // Pure dark accent
          crimson: '#E63946',    // Vibrant cadmium crimson
          ultramarine: '#2563EB',// Cobalt / ultramarine blue
          ochre: '#D97706',      // Golden yellow ochre
          emerald: '#059669',    // Deep viridian emerald
          amber: '#F59E0B',      // Warm sunlit amber
          gold: '#C5A059',       // Fine art gilded gold
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        display: ['Syne', 'Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'blur(20px)' },
          '50%': { opacity: '0.8', filter: 'blur(30px)' },
        }
      },
      boxShadow: {
        'soft-lux': '0 20px 40px -15px rgba(26, 24, 22, 0.07)',
        'card-lux': '0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
        'glow-crimson': '0 10px 25px -5px rgba(230, 57, 70, 0.3)',
        'glow-gold': '0 10px 25px -5px rgba(197, 160, 89, 0.3)',
      }
    },
  },
  plugins: [],
}
