import { defineConfig } from "vitest/config";
import path from "node:path";

// Tests de Security Rules y del servidor contra los emuladores ya levantados
// (npm run emulators). Ojo: borran los datos de los emuladores.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // "server-only" tira error fuera de Next; en los tests no aplica.
      "server-only": path.resolve(__dirname, "tests/helpers/empty.ts"),
    },
  },
  test: {
    include: ["tests/rules/**/*.test.ts", "tests/server/**/*.test.ts"],
    globalSetup: ["tests/helpers/check-emulators.ts"],
    fileParallelism: false,
    env: {
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
      FIREBASE_PROJECT_ID: "demo-cable-a-tierra",
    },
  },
});
