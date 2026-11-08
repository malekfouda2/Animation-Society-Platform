import eslintReact from "@eslint-react/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import reactHooks from "eslint-plugin-react-hooks";
import base from "../../eslint.config.base.mjs";

/**
 * Web lint stack (ESLint 10): shared strict type-checked TypeScript rules, Next.js core web vitals,
 * React (type-aware), hooks, and strict JSX accessibility rules. eslint-config-next is not used
 * because its legacy plugins pin a vulnerable minimatch range (see docs/DECISIONS.md).
 */
export default [
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"] },
  ...base,
  {
    files: ["**/*.{ts,tsx}"],
    ...nextPlugin.configs["core-web-vitals"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...eslintReact.configs["recommended-type-checked"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...reactHooks.configs.flat["recommended-latest"],
  },
  {
    files: ["**/*.tsx"],
    ...jsxA11y.configs.strict,
  },
  {
    rules: {
      // Server-only code must never be imported into the web bundle.
      "no-restricted-imports": ["error", { patterns: ["mongoose", "express", "@as/api", "@as/api/*"] }],
    },
  },
];
