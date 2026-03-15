/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
    './src/features/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A2463',
          50: '#E8EDF8',
          100: '#C5D0EE',
          200: '#8FA3DC',
          300: '#5976CA',
          400: '#2B4DB8',
          500: '#0A2463',
          600: '#081D52',
          700: '#061641',
          800: '#040E30',
          900: '#02071F',
        },
        green: {
          400: '#8BC34A',
          500: '#4CAF50',
          600: '#388E3C',
        },
        orange: {
          DEFAULT: '#FF6D00',
          400: '#FF8F00',
          500: '#FF6D00',
          600: '#E65100',
        },
        teal: {
          DEFAULT: '#0F9B8E',
          500: '#0F9B8E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
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
      },
    },
  },
  plugins: [],
};
