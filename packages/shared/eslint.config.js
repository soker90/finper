import globals from 'globals'
import neostandard from 'neostandard'
import importPlugin from 'eslint-plugin-import'
import tsParser from '@typescript-eslint/parser'
import tseslint from '@typescript-eslint/eslint-plugin'

export default [
  importPlugin.flatConfigs.recommended,
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
      '@typescript-eslint/no-unused-vars': 'error'
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
  },

  {
    ignores: ['dist', 'build', 'node_modules'],
  },
]
