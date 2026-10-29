import { defineConfig } from "vitest/config";

// Tests contra Postgres + PostgREST en Docker. Ver tests/db/global-setup.ts.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["tests/db/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/db/global-setup.ts"],
    // El puerto 54331 es el del proxy de tests/db/env.ts.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54331",
      SUPABASE_SECRET_KEY: "test-secret-key",
      ADMIN_EMAILS: "admin@example.com",
    },
    // Comparten una sola base: un archivo por vez.
    fileParallelism: false,
    hookTimeout: 120_000,
  },
});
