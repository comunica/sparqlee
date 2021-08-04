module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname, // this is the reason this is a .js file
        project: ['./tsconfig.eslint.json'],
    },
    extends: [
        '@rubensworks'
    ],
    rules: {
        'no-implicit-coercion': 'off',

        // should stay off
        'mocha/no-exports': 'off',

        // needs investigation
        'no-implicit-globals': 'off',
        'require-unicode-regexp': 'off',
        'object-property-newline': 'off',
        'unicorn/consistent-destructuring': 'off',
        'quote-props': 'off',
        'mocha/max-top-level-suites': 'off',
        'mocha/no-skipped-tests': 'off',
        'multiline-comment-style': 'off',
        'unicorn/prefer-spread': 'off',
        'no-useless-escape': 'off',
        'unicorn/prefer-string-slice': 'off',
        '@typescript-eslint/brace-style': 'off',
        'import/no-extraneous-dependencies': 'off',
        '@typescript-eslint/unbound-method': 'off',
        'no-sync': 'off',
        'no-redeclare': 'off',
        'unicorn/prefer-top-level-await': 'off',
        'unicorn/filename-case': 'off',
        '@typescript-eslint/no-base-to-string': 'off',
    }
};
