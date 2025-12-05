const next = require('eslint-config-next');
const react = require('eslint-plugin-react');
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
  // Extend Next.js configuration
  ...next,
  {
    files: ['**/*.js', '**/*.jsx'],
    plugins: {
      react: react,
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
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      indent: ['error', 2],
      'no-unused-vars': 'warn',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
      'no-debugger': 'warn',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
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
      'react/jsx-curly-spacing': ['error', { when: 'never', children: true }],
      'react/jsx-tag-spacing': [
        'error',
        {
          closingSlash: 'never',
          beforeSelfClosing: 'always',
          afterOpening: 'never',
          beforeClosing: 'never',
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
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
      'react/prop-types': 'off',
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
