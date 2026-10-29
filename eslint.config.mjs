import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['templates/', 'types/', 'test/dev-ui/fixtures/'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      eqeqeq: ['error', 'smart'],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-const': 'error',
    },
  },
];
