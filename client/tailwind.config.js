/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        red: {
          600: '#dc2626',
        },
        yellow: {
          300: '#fde047',
          400: '#facc15',
        },
        gray: {
          50: '#f9fafb',
          200: '#e5e7eb',
          300: '#d1d5db',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
}
