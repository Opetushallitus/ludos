const { MOBILE_BREAKPOINT, LARGE_SCREEN_BREAKPOINT } = require('./src/constants.ts')
/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  content: ['./src/**/*.{ts,tsx}'], theme: {
    colors: {
      green: { primary: '#3A7A10', light: '#5BCA13' },
      gray: { primary: '#4B4B4B', secondary: '#808080', light: '#E8E9EC', bg: '#F5F7F9', separator: '#DBE2E9', active: '#DADADA', border: '#B2B2B2' },
      black: '#000000',
      white: '#FFFFFF',
      yellow: '#FFD900',
      red: { primary: '#CC3300', light: '#FF4D4D' },
    }, screens: {
      'md': MOBILE_BREAKPOINT,
      'lg': LARGE_SCREEN_BREAKPOINT,
    },
    fontSize: {
      xss: ['11px', '21px'],
      xs: ['13px', '18px'],
      sm: ['16px', '22px'],
      base: ['18px', '24px'],
      lg: ['20px', '28px'],
      xl: ['24px', '32px'],
    },
    extend: {
      borderWidth: {
        '5': '5px', '6': '6px'
      }
    }
  }, plugins: []
}

module.exports = tailwindConfig
