import { defineConfig, devices } from "@playwright/test";

// Corre dentro de `firebase emulators:exec` (npm run test:e2e), con una base vacía.
// Usa el puerto 3100 para no chocar con un `npm run dev` abierto en el 3000.
const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Build de producción y no `next dev`: dev compila cada página y acción la primera vez que
  // se usa, y en /mnt/c eso a veces pasa los timeouts y hace fallar el test al azar.
  webServer: {
    command: `npx next build && npx next start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 400_000,
    reuseExistingServer: false,
    env: { NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true", NEXT_DIST_DIR: ".next-e2e" },
  },
});
