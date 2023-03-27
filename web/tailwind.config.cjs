/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  content: ['./src/**/*.{ts,tsx}'], theme: {
    colors: {
      green: { primary: '#3A7A10', light: '#5BCA13' },
      gray: { primary: '#000000', secondary: '#4B4B4B', light: '#E8E9EC' },
      separator: '#DBE2E9',
      white: '#FFFFFF',
      yellow: '#FFD900'
    }, extend: {
      borderWidth: {
        '5': '5px',
        '6': '6px'
      }
    }
  }, plugins: []
}

module.exports = tailwindConfig
