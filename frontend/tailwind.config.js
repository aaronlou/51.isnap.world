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
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(229, 166, 35, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(229, 166, 35, 0.5)' },
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
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
    },
  },
  plugins: [],
}
