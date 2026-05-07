/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          50: '#f0f0f8',
          100: '#e0e0f0',
          200: '#c8c8e0',
          300: '#a8a8c4',
          400: '#8b8ba7',
          500: '#6b6b8d',
          600: '#252545',
          700: '#1a1a2e',
          800: '#0f0f1a',
          900: '#07070d',
        },
        gold: {
          100: '#fdf4d8',
          200: '#f8e3a0',
          300: '#f2cd60',
          400: '#eebb40',
          500: '#e5a623',
          600: '#c78a00',
        },
        bronze: {
          400: '#cd7f32',
          500: '#b87333',
        },
        silver: {
          300: '#e8e8e8',
          400: '#c0c0c0',
          500: '#a8a8a8',
        },
        neon: {
          red: '#ff2e63',
          blue: '#00d9ff',
          purple: '#b829dd',
          pink: '#ff6b9d',
        }
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'scanline': 'scanline 8s linear infinite',
        'spin-slow': 'spin 20s linear infinite',
        'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease-in-out infinite',
        'border-pulse': 'border-pulse 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float-up': 'float-up 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float-particle': 'float-particle 5s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'shake-hard': 'shake-hard 0.6s ease-in-out',
        'score-pop': 'score-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(229, 166, 35, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(229, 166, 35, 0.5), 0 0 80px rgba(229, 166, 35, 0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        'shake-hard': {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '10%': { transform: 'translateX(-8px) rotate(-2deg)' },
          '20%': { transform: 'translateX(6px) rotate(2deg)' },
          '30%': { transform: 'translateX(-6px) rotate(-1deg)' },
          '40%': { transform: 'translateX(4px) rotate(1deg)' },
          '50%': { transform: 'translateX(-3px) rotate(-1deg)' },
          '60%': { transform: 'translateX(2px) rotate(0deg)' },
          '70%': { transform: 'translateX(-1px) rotate(0deg)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 0.8 },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'border-pulse': {
          '0%, 100%': { borderColor: 'rgba(229, 166, 35, 0.3)' },
          '50%': { borderColor: 'rgba(229, 166, 35, 0.8)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(229, 166, 35, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(229, 166, 35, 0.4), 0 0 80px rgba(229, 166, 35, 0.15)' },
        },
        'float-up': {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: 0.6 },
          '50%': { transform: 'translateY(-20px) scale(1.1)', opacity: 1 },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'float-particle': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: 0 },
          '25%': { opacity: 0.8 },
          '50%': { transform: 'translateY(-40px) translateX(20px)', opacity: 0.4 },
          '75%': { opacity: 0.2 },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: 0.8 },
          '100%': { transform: 'scale(1.5)', opacity: 0 },
        },
        'score-pop': {
          '0%': { transform: 'scale(0.3)', opacity: 0 },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: 0 },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
    },
  },
  plugins: [],
}
