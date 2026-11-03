import { chromium } from "@playwright/test";
import checkEmulators from "../helpers/check-emulators";
import { clearAuth, clearFirestore } from "../helpers/emulators";
import { signInWithGoogle } from "./helpers";

const BASE_URL = "http://localhost:3000";

// En dev, Next compila cada página la primera vez que se pide, y el primer server
// action compila firebase-admin (~20 s en /mnt/c). Mientras compila, el servidor
// demora las demás requests y los tests en paralelo se pasan de tiempo. Por eso se
// hace una pasada antes: se piden las páginas y se inicia sesión una vez.
// Para las rutas dinámicas alcanza con cualquier id.
const ROUTES = [
  "/",
  "/organizaciones",
  "/organizaciones/nueva",
  "/organizaciones/calentar",
  "/organizaciones/calentar/editar",
  "/organizaciones/calentar/jugadores/nuevo",
  "/organizaciones/calentar/jugadores/calentar/editar",
  "/organizaciones/calentar/partidos/nuevo",
  "/organizaciones/calentar/partidos/calentar",
  "/organizaciones/calentar/partidos/calentar/editar",
];

async function warmUp() {
  for (const route of ROUTES) await fetch(`${BASE_URL}${route}`);
  const browser = await chromium.launch();
  try {
    const page = await (await browser.newContext({ baseURL: BASE_URL })).newPage();
    await signInWithGoogle(page, "Calentamiento");
  } finally {
    await browser.close();
  }
}

// Cada corrida de E2E arranca con los emuladores vacíos.
export default async function globalSetup() {
  await checkEmulators();
  await warmUp();
  await Promise.all([clearFirestore(), clearAuth()]);
}
