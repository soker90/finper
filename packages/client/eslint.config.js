import globals from "globals";
import neostandard from "neostandard";
import importPlugin from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import tsParser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";

export default [
  importPlugin.flatConfigs.recommended,
  ...neostandard(),
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
        JSX: "readonly"
      },
    },
    plugins: {
      react: reactPlugin,
      "@typescript-eslint": tseslint,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
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
    ignores: ["dist", "node_modules", "build", "public", "src/env.d.ts"]
  }
];