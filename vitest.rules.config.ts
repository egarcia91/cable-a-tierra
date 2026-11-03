import { defineConfig } from "vitest/config";

// Tests de Security Rules: corren contra el emulador de Firestore (npm run test:rules).
export default defineConfig({
  test: {
    include: ["tests/rules/**/*.test.ts"],
    fileParallelism: false,
  },
});
