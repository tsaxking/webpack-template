module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:svelte/recommended'
    ],
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        ''
    ],
    root: true,

    // rules
    rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': [
            'warn',
            { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
    },

    parserOptions: {
        // project: ["./tsconfig.eslint.json"],
        // tsconfigRootDir: __dirname,
    },

    ignorePatterns: ['node_modules/', 'dist/', '**/*.js', '**/submodules/'],

    overrides: [
        {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser'
        }
    ]
};
