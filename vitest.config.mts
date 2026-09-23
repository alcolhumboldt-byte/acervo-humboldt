import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    // Los tests de integración comparten una sola base de datos y limpian sus
    // tablas. En paralelo se borran los datos unos a otros.
    fileParallelism: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.join(projectRoot, "src"),
      "server-only": path.join(projectRoot, "vitest.server-only-stub.ts"),
    },
  },
});
