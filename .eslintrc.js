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
        'mocha/no-skipped-tests': 'off',

        // Ask ruben
        'unicorn/prefer-top-level-await': 'off',
        'no-redeclare': 'off',
        'no-sync': 'off',
        '@typescript-eslint/unbound-method': 'off',
        'multiline-comment-style': 'off',
        'no-implicit-globals': 'off',
    }
};
