import { defineConfig } from "vitest/config";

// Tests unitarios: rápidos, sin base de datos.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
