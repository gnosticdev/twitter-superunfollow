/** @type {import('eslint').Linter.Config} */
module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    overrides: [
        {
            env: {
                node: true,
            },
            files: ['.eslintrc.{js,cjs}'],
            parserOptions: {
                sourceType: 'script',
            },
        },
    ],
    globals: {
        process: 'readonly',
        chrome: 'readonly',
    },
    ignorePatterns: ['dist', 'node_modules'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint', 'simple-import-sort'],
    rules: {
        '@typescript-eslint/no-explicit-any': 'off',
    },
}
