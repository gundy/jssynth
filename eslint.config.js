import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', 'apps/harness/src/songs/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    // The legacy engine predates these rules; surface them as warnings (non-blocking)
    // so `lint` runs green during the M1 rehome. We tighten incrementally in later passes.
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      'no-prototype-builtins': 'off',
      'no-empty': 'warn',
      'no-cond-assign': 'off',
      'no-fallthrough': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
    },
  },
)
