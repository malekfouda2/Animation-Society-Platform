import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/integration/**/*.int.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
