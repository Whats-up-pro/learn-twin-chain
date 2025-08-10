/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5ffff',
          100: '#bef0ff',
          200: '#6dd7fd',
          300: '#0093cb',
          400: '#005acd',
          500: '#0047a3',
          600: '#003d8a',
          700: '#002d66',
        },
        brand: {
          50: '#f5ffff',
          100: '#bef0ff',
          200: '#6dd7fd',
          300: '#0093cb',
          400: '#005acd',
          500: '#0047a3',
          600: '#003d8a',
          700: '#002d66',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}