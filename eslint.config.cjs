const next = require('eslint-config-next');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      '**/node_modules/',
      '**/.next/',
      '**/dist/',
      '**/public/sw.js',
      '**/public/service-worker.js',
      '**/public/workbox-*.js',
      '**/public/manifest.json',
    ],
  },
  // Extend Next.js configuration (includes core ESLint recommended rules)
  ...next,
  {
    files: ['**/*.js', '**/*.jsx'],
    plugins: {
      react: react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Basic JavaScript best practices
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'warn',
      'no-unused-vars': 'warn',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],

      // React specific rules
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Code style (non-Prettier rules)
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'no-extra-semi': 'error',
      'no-mixed-spaces-and-tabs': 'error',
      'no-trailing-spaces': 'error',
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'never',
        },
      ],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'jsx-quotes': ['error', 'prefer-double'],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    // Test files configuration
    files: [
      '**/__tests__/**',
      '**/*.test.js',
      '**/*.test.jsx',
      '**/*.spec.js',
      '**/*.spec.jsx',
    ],
    rules: {
      'no-unused-vars': 'off',
      'no-unused-expressions': 'off',
      'no-console': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  // Prettier configuration - should be last to override other configs
  {
    ...prettierConfig,
    plugins: {
      prettier: prettier,
    },
    rules: {
      'prettier/prettier': ['error', require('./.prettierrc.js')],
    },
  },
];
