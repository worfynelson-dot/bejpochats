/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bejpoDark: "#0a192f",
        bejpoBlue: "#3b82f6",
      },
    },
  },
  plugins: [],
}
