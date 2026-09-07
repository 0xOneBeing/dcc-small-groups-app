import { defineConfig } from "vitest/config";
import path from "node:path";

// Integration tests hit a real Postgres (the dedicated test database — see
// vitest.setup.integration.ts) rather than mocking Prisma, so they run
// separately from the fast pure-function unit tests (`npm run test`).
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    setupFiles: ["./vitest.setup.integration.ts"],
    // DB round trips are slower than pure-function unit tests; also these
    // tests share one Postgres instance, so keep them from stepping on
    // each other's fixture data.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
      "server-only": path.resolve(import.meta.dirname, "test/server-only-stub.ts"),
    },
  },
});
