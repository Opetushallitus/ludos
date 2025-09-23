const tailwindcss = require("@tailwindcss/postcss")

const postcssConfig = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {}
  }
}

module.exports = postcssConfig