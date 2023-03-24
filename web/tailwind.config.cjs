/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  content: ['./src/**/*.{ts,tsx}'], theme: {
    colors: {
      gray: {
        900: '#202225',
        800: '#2f3136',
        700: '#36393f',
        600: '#4f545c',
        400: '#d4d7dc',
        300: '#e3e5e8',
        200: '#ebedef',
        100: '#f2f3f5'
      }, omaVari: {
        100: '#FD5532'
      }
    }, extend: {}
  }, plugins: []
}

module.exports = tailwindConfig
