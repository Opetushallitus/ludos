const eslintConfig = {
  extends: ['plugin:@typescript-eslint/recommended-type-checked'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json'
  },
}

module.exports = eslintConfig
