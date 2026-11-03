import { defineConfig, devices } from "@playwright/test";

// Usa los emuladores ya levantados (npm run emulators). No los arranca acá:
// al terminar, Playwright cierra la CLI de Firebase pero deja vivo el proceso
// Java del emulador de Firestore, que queda ocupando el puerto 8080.
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "tests/helpers/check-emulators.ts",
  use: { baseURL: "http://localhost:3000" },
  projects: [{ name: "mobile-chrome", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
