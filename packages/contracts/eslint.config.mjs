import base from "../../eslint.config.base.mjs";

export default [
  ...base,
  {
    // Contracts are bundled into the browser: forbid server-only imports.
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: ["node:*", "mongoose", "express", "@as/api", "@as/api/*"] },
      ],
    },
  },
];
