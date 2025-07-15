/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./app/**/**/*.{js,ts,jsx,tsx}",
      "./app/components/**/*.{js,ts,jsx,tsx}",
      "./app/onramp/*.{js,ts,jsx,tsx}",
      "./app/register/*.{js,ts,jsx,tsx}",
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