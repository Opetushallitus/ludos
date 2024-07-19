module.exports = {
    extends: ['plugin:prettier/recommended'],
    plugins: ['prettier'],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        }, ecmaVersion: 2018, sourceType: 'module'
    },
    rules: {
        curly: 'error',
        'no-magic-numbers': 'off',
        eqeqeq: 'error',
        'no-undef-init': 'error',
        'no-unneeded-ternary': 'error',
        'no-var': 'error',
        'prefer-promise-reject-errors': 'error',
        'prefer-template': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 'off'
    }
}