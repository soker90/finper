import globals from "globals";
import neostandard from "neostandard";
import importPlugin from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";

export default [
  importPlugin.flatConfigs.recommended,
  ...neostandard(),
  reactHooksPlugin.configs.flat['recommended-latest'],
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {jsx: true},
      },
      globals: {
        ...globals.browser,
        ...globals.es2025,
        JSX: "readonly",
        __APP_VERSION__: "readonly"
      },
    },
    plugins: {
      react: reactPlugin,
      "@typescript-eslint": tseslint,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      // react-hooks/incompatible-library stays as warn: false positives from
      // react-hook-form watch() and @tanstack/react-virtual useVirtualizer.
      // All other React Compiler diagnostic rules use the preset default (error).
      "react-hooks/incompatible-library": "warn",
    },
    settings: {
      react: {
        version: "detect"
      },
      "import/resolver": {
        typescript: {}
      },
    }
  },
  {
    ignores: ["dist", "node_modules", "build", "public", "src/env.d.ts", "src/vite-env.d.ts"]
  }
];