import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "docs", "android", "ios"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // a11y rules as warnings (not blocking) — fix incrementally
      ...Object.fromEntries(
        Object.entries(jsxA11y.configs.recommended.rules).map(([k, v]) => [k, "warn"])
      ),
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // label-has-for esta DEPRECADA en jsx-a11y v6.1+; ya cubrimos el caso
      // moderno con label-has-associated-control. Duplicar warnings solo agrega ruido.
      "jsx-a11y/label-has-for": "off",
    },
  },
);
