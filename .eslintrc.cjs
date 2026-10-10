/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh', 'boundaries'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  settings: {
    'boundaries/elements': [
      { type: 'core', pattern: 'src/core/*' },
      { type: 'shared', pattern: 'src/shared/*' },
      { type: 'entities', pattern: 'src/entities/*' },
      { type: 'features', pattern: 'src/features/*' },
      { type: 'widgets', pattern: 'src/widgets/*' },
      { type: 'app', pattern: 'src/app/*' },
    ],
    'boundaries/ignore': ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          { from: 'core', allow: ['core'] },
          { from: 'shared', allow: ['shared', 'core'] },
          { from: 'entities', allow: ['entities', 'shared', 'core'] },
          { from: 'features', allow: ['features', 'entities', 'shared', 'core'] },
          { from: 'widgets', allow: ['widgets', 'features', 'entities', 'shared', 'core'] },
          { from: 'app', allow: ['app', 'widgets', 'features', 'entities', 'shared', 'core'] },
        ],
      },
    ],
    'boundaries/no-private': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: { 'boundaries/element-types': 'off' },
    },
    {
      files: ['*.cjs', 'vite.config.ts', 'vitest.config.ts', 'playwright.config.ts'],
      rules: { 'boundaries/element-types': 'off' },
    },
  ],
  ignorePatterns: ['dist', 'node_modules', 'playwright-report', 'test-results'],
};
