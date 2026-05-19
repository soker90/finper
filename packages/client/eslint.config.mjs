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
      // React Compiler diagnostic rules: keep visible but non-blocking until
      // pre-existing tech debt (setState in effect, impure render, etc.) is
      // cleaned up incrementally. The compiler itself still runs at build
      // time and applies its optimizations or bails out per-component.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/set-state-in-render": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/incompatible-library": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/void-use-memo": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/globals": "warn",
      "react-hooks/gating": "warn",
      "react-hooks/config": "warn",
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