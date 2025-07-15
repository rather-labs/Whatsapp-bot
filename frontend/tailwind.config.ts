/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
      "./components/*.{js,ts,jsx,tsx}",
      "./pages/**/*.{js,ts,jsx,tsx}",     // if you ever add one
    ],
    darkMode: ['class'], 
    safelist: ['dark'], 
    theme: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      extend: {},
    },
    plugins: [],
  }