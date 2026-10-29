import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
  // "server-only" tira error fuera de Next; en los tests es un módulo vacío.
  "server-only": fileURLToPath(new URL("./src/test/empty.ts", import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.emu.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          // Corren dentro de `firebase emulators:exec` (npm run test:emu).
          name: "emulator",
          include: ["src/**/*.emu.test.ts"],
          env: {
            NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
            FIREBASE_PROJECT_ID: "demo-cable-a-tierra",
          },
          // Comparten la misma base del emulador: un archivo a la vez.
          fileParallelism: false,
        },
      },
    ],
  },
});
