const next = require('eslint-config-next');
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
    files: ['**/*.js'],
    rules: {
      // Basic JavaScript best practices
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'warn',
      'no-unused-vars': 'warn',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],

      // Code style (non-Prettier rules)
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
    },
  },
  {
    // Test files configuration
    files: ['**/__tests__/**', '**/*.test.js', '**/*.spec.js'],
    rules: {
      'no-unused-vars': 'off',
      'no-unused-expressions': 'off',
      'no-console': 'off',
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
