/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  content: ['./src/**/*.{ts,tsx}'], theme: {
    colors: {
      green: { primary: '#3A7A10', light: '#5BCA13' }, gray: { primary: '#000000', light: '#4B4B4B' }
    },
    extend: {
      borderWidth: {
        '5': '5px'
      },
    }
  }, plugins: []
}

module.exports = tailwindConfig
