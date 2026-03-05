/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          deep: '#050f32',
          900: '#0a0f1e',
          800: '#0d1b2a',
          700: '#1a2744',
        },
        sand: {
          light: '#e8dcc8',
        },
        gold: {
          DEFAULT: '#f4c542',
          400: '#f4c542',
          500: '#e6a800',
        },
      },
      fontFamily: {
        heading: ['"Cinzel"', 'serif'],
        numbers: ['"Roboto"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
