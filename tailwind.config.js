/** @type {import('tailwindcss').Config} */
export default {
  // Carpetas explícitas: el glob anterior (`./**/*`) recorría también `node_modules`.
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Era la config inline del CDN en `index.html`.
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
