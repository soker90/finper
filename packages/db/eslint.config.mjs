import globals from 'globals'
import neostandard from 'neostandard'
import tsParser from '@typescript-eslint/parser'
import tseslint from '@typescript-eslint/eslint-plugin'

export default [
  ...neostandard(),
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },

  {
    ignores: ['dist', 'build', 'node_modules', 'eslint.config.mjs'],
  },
]
