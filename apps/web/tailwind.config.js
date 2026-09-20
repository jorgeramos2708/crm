/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Rampa cálida estilo alabastro: sustituye al zinc frío en toda la app
      colors: {
        zinc: {
          50: '#faf9f7',
          100: '#f4f2ed',
          200: '#e8e3d9',
          300: '#d7d0c2',
          400: '#a8a094',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
      },
    },
  },
  plugins: [],
}