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
        // Light mode
        'cr-primary': '#2E4F54',
        'cr-accent': '#7CCFD0',
        'cr-button-text': '#FFFFFF',
        'cr-card-bg': '#F8F9FA',
        'cr-border': '#DDE5E7',
        
        // Dark mode variants
        'cr-dark-bg': '#1C2C2F',
        'cr-dark-text': '#E0F4F5',
        'cr-dark-card-bg': '#24393C',
        'cr-dark-border': '#3F5E63',
      },
    },
  },
  plugins: [],
};