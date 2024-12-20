module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: './tsconfig.json',
        extraFileExtensions: ['.svelte'] // This is a required setting in `@typescript-eslint/parser` v4.24.0.
    },
    overrides: [
        {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            // Parse the `<script>` in `.svelte` as TypeScript by adding the following configuration.
            parserOptions: {
                parser: '@typescript-eslint/parser'
            },
            rules: {
                'no-self-assign': 'off',
                'no-duplicate-imports': 'off',
                'no-undef': 'off'
            }
        },
        {
            files: ['*.ts'],
            rules: {
                'no-undef': 'off'
            }
        }
    ],
    plugins: ['@typescript-eslint', 'svelte'],
    root: true,

    // rules
    rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': [
            'warn',
            { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
        ],

        '@typescript-eslint/no-namespace': 'off',

        semi: ['error', 'always'],
        // quotes: ['warn', 'single'],
        'array-callback-return': 'error',
        'constructor-super': 'error',
        'for-direction': 'error',
        'getter-return': 'error',
        'no-array-constructor': 'error',
        'no-async-promise-executor': 'error',
        'no-await-in-loop': 'warn',
        'no-class-assign': 'error',
        'no-compare-neg-zero': 'error',
        'no-cond-assign': 'error',
        'no-const-assign': 'error',
        'no-constant-binary-expression': 'error',
        'no-constant-condition': 'error',
        'no-constructor-return': 'error',
        'no-control-regex': 'error',
        'no-debugger': 'error',
        'no-dupe-args': 'error',
        'no-dupe-class-members': 'error',
        'no-dupe-else-if': 'error',
        'no-dupe-keys': 'error',
        'no-duplicate-case': 'error',
        'no-duplicate-imports': 'warn',
        'no-empty-character-class': 'error',
        'no-empty-pattern': 'error',
        'no-ex-assign': 'error',
        'no-fallthrough': 'error',
        'no-func-assign': 'error',
        'no-inner-declarations': 'error',
        'no-invalid-regexp': 'error',
        'no-irregular-whitespace': 'warn',
        'no-loss-of-precision': 'error',
        'no-misleading-character-class': 'error',
        'no-new-native-nonconstructor': 'error',
        'no-new-symbol': 'error',
        'no-obj-calls': 'error',
        // "no-promise-executor-return": "error",
        'no-prototype-builtins': 'error',
        'no-self-assign': 'error',
        'no-self-compare': 'error',
        'no-setter-return': 'error',
        'no-sparse-arrays': 'warn',
        'no-template-curly-in-string': 'warn',
        'no-this-before-super': 'error',
        'no-undef': 'error',
        'no-unexpected-multiline': 'error',
        'no-unmodified-loop-condition': 'error',
        'no-unreachable': 'warn',
        'no-unreachable-loop': 'warn',
        'no-unsafe-finally': 'error',
        'no-unsafe-negation': 'error',
        'no-unsafe-optional-chaining': 'error',
        'no-unused-private-class-members': 'warn',
        // 'no-use-before-define': [
        //     'error'
        // ],
        'no-useless-backreference': 'error',
        'require-atomic-updates': 'warn',
        'use-isnan': 'error',
        'valid-typeof': 'error',

        // "accessor-pairs": "error",
        'arrow-body-style': 'off',
        camelcase: 'warn',
        'no-var': 'error',
        'no-with': 'error',
        'no-console': 'off',

        // typescript
        '@typescript-eslint/no-explicit-any': 'error',

        'no-else-return': 'warn',

        // svelte
        'svelte/infinite-reactive-loop': 'error',
        'svelte/no-dom-manipulating': 'warn',
        'svelte/no-dupe-else-if-blocks': 'error',
        'svelte/no-dupe-on-directives': 'error',
        'svelte/no-dupe-style-properties': 'error',
        'svelte/no-dupe-use-directives': 'error',
        'svelte/no-export-load-in-svelte-module-in-kit-pages': 'warn',
        'svelte/no-not-function-handler': 'error',
        'svelte/no-object-in-text-mustaches': 'error',
        'svelte/no-reactive-reassign': 'error',
        'svelte/no-shorthand-style-property-overrides': 'error',
        'svelte/no-store-async': 'error',
        'svelte/no-unknown-style-directive-property': 'error',
        'svelte/require-store-callbacks-use-set-param': 'warn',
        'svelte/require-store-reactive-access': 'error',
        'svelte/valid-compile': 'warn',
        'svelte/no-at-html-tags': 'error',
        'svelte/no-target-blank': 'warn',
        'svelte/block-lang': ['error', { script: 'ts' }],
        'svelte/button-has-type': 'warn',
        'svelte/no-at-debug-tags': 'error',
        'svelte/no-ignored-unsubscribe': 'error',
        'svelte/no-immutable-reactive-statements': 'error',
        'svelte/no-reactive-functions': 'error',
        'svelte/no-reactive-literals': 'error',
        'svelte/no-svelte-internal': 'error',
        'svelte/no-unused-svelte-ignore': 'warn',
        'svelte/no-useless-mustaches': 'warn',
        'svelte/prefer-destructured-store-props': 'warn',
        'svelte/require-each-key': 'warn', // should probably be error
        'svelte/require-event-dispatcher-types': 'warn', // I'll eventually want this to be an error
        'svelte/require-optimized-style-attribute': 'error',
        'svelte/require-stores-init': 'error',
        'svelte/valid-each-key': 'error',
        'svelte/derived-has-same-inputs-outputs': 'error',
        'svelte/first-attribute-linebreak': 'warn',
        'svelte/html-closing-bracket-spacing': 'warn',
        // 'svelte/html-quotes': 'warn' // commented out because the formatter automatically puts double quotes currently
        'svelte/html-self-closing': 'warn',
        'svelte/indent': [
            'warn',
            {
                indent: 4
            }
        ],
        'svelte/max-attributes-per-line': [
            'warn',
            {
                multiline: 1,
                singleline: 1
            }
        ],
        'svelte/mustache-spacing': 'warn',
        'svelte/no-extra-reactive-curlies': 'warn',
        // 'svelte/no-restricted-html-elements': 'off'
        'svelte/no-spaces-around-equal-signs-in-attribute': 'warn',
        'svelte/prefer-class-directive': 'warn',
        'svelte/prefer-style-directive': 'warn',
        'svelte/shorthand-attribute': 'warn',
        'svelte/sort-attributes': 'warn',
        'svelte/spaced-html-comment': 'warn'
    },

    ignorePatterns: ['node_modules/', 'dist/', '**/*.js', '**/submodules/'],
    env: {
        'shared-node-browser': true,
        browser: true,
        es6: true,
        jquery: true,
        node: true
    }
};
