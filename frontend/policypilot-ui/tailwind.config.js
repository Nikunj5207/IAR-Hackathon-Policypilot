/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0F2A44',
        gold: '#C4A574',
        'surface-card': '#ffffff',
        'bg-app': '#F8F5F0',
      },
    },
  },
  plugins: [],
}
