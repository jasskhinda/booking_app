/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Teal & White Theme
        'primary': '#ffffff', // White for headings/body
        'accent': '#7bcfd0', // Teal
        'button': '#7bcfd0', // Teal for buttons
        'button-text': '#ffffff', // White text on buttons
        'background': '#ffffff', // White background
        'card-bg': '#ffffff', // White cards
        'border': '#e5e7eb', // Light gray border
        'text': '#ffffff', // White text (for dark backgrounds)
      },
    },
  },
  plugins: [],
};