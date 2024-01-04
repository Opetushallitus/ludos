const eslintConfig = {
  plugins: ['prettier', 'react-hooks', 'jsx-a11y'],
  extends: ['plugin:prettier/recommended', "plugin:jsx-a11y/recommended"],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    curly: 'error',
    eqeqeq: 'error',
    'no-undef-init': 'error',
    'no-unneeded-ternary': 'error',
    'no-var': 'error',
    'prefer-promise-reject-errors': 'error',
    'prefer-template': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}

module.exports = eslintConfig