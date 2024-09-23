const eslintConfig = {
  plugins: ['prettier', 'react-hooks', 'jsx-a11y'],
  extends: ['plugin:prettier/recommended', "plugin:jsx-a11y/recommended", "plugin:@tanstack/eslint-plugin-query/recommended"],
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
    curly: ["error", "multi-line"],
    eqeqeq: 'error',
    'no-undef-init': 'error',
    'no-unneeded-ternary': 'error',
    'no-var': 'error',
    'prefer-promise-reject-errors': 'error',
    'prefer-template': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "@tanstack/query/exhaustive-deps": "error",
    "@tanstack/query/no-rest-destructuring": "warn",
    "@tanstack/query/stable-query-client": "error"
  }
}

module.exports = eslintConfig