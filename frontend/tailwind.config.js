/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        upay: {
          blue: "#004B87",
          dark: "#002B49",
          gold: "#FFB800",
          danger: "#DC2626",
          success: "#16A34A"
        }
      }
    },
  },
  plugins: [],
}