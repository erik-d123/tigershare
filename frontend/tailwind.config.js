/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        princeton: {
          orange: '#F58025',
          black: '#000000',
        },
      },
    },
  },
  plugins: [],
}