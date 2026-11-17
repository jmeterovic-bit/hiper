import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'android/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, __APP_VERSION__: 'readonly' }
    },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }]
    }
  }
];
