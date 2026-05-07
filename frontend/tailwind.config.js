/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50:  '#f5f3ef',
          100: '#e8e4dc',
          200: '#d4cdc0',
          300: '#b8ad9c',
          400: '#9a8d7a',
          500: '#7d7162',
          600: '#5e5448',
          700: '#454038',
          800: '#2e2a24',
          900: '#1a1814',
          950: '#0a0908',
        },
        cream: {
          DEFAULT: '#f0ece4',
          muted: '#a09888',
          subtle: '#6b6558',
        },
        gold: {
          50:  '#faf6ef',
          100: '#f2ead8',
          200: '#e6d5b0',
          300: '#d4b87a',
          400: '#c4a265',
          500: '#b08d4e',
          600: '#8f7140',
          700: '#6e5632',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Sora"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.4s ease-out forwards',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
