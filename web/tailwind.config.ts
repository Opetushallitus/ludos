import colors from './src/colors'
import { LARGE_SCREEN_BREAKPOINT, MOBILE_BREAKPOINT } from './src/constants'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      green: {
        primary: colors.greenPrimary,
        light: colors.greenLight
      },
      gray: {
        primary: colors.grayPrimary,
        secondary: colors.graySecondary,
        light: colors.grayLight,
        bg: colors.grayBg,
        separator: colors.graySeparator,
        active: colors.grayActive,
        border: colors.grayBorder
      },
      black: colors.black,
      white: colors.white,
      yellow: colors.yellow,
      red: {
        primary: colors.redPrimary,
        light: colors.redLight
      }
    },
    screens: {
      md: MOBILE_BREAKPOINT,
      lg: LARGE_SCREEN_BREAKPOINT
    },
    fontSize: {
      xss: ['11px', '21px'],
      xs: ['13px', '18px'],
      sm: ['16px', '22px'],
      base: ['18px', '24px'],
      lg: ['20px', '28px'],
      xl: ['24px', '32px'],
      h1: ['1.5rem', '1.875rem'],
      h2: ['1.375rem', '1.75rem'],
      h3: ['1.25rem', '1.625rem'],
      h4: ['1rem', '1.375rem']
    },
    extend: {
      borderWidth: {
        '5': '5px',
        '6': '6px'
      }
    }
  }
}
