import globals from 'globals'
import neostandard from 'neostandard'
import importPlugin from 'eslint-plugin-import'
import tsParser from '@typescript-eslint/parser'
import tseslint from '@typescript-eslint/eslint-plugin'
import jestPlugin from 'eslint-plugin-jest'

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
      '@typescript-eslint/no-unused-vars': 'error',
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^@soker90/finper-models', '^mongoose$', '^@typescript-eslint/', '^eslint-plugin-']
        }
      ]
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.ts']
        }
      },
    },
  },

  {
    files: ['**/*.test.{ts,js}'],
    languageOptions: {
      globals: jestPlugin.environments.globals.globals,
    },
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      'jest/expect-expect': 'off',
    },
  },

  {
    ignores: ['dist', 'build', 'node_modules', 'eslint.config.js'],
  },
]
