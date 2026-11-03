import { expect, type Page } from "@playwright/test";

/**
 * Inicia sesión con una cuenta nueva a través del popup del emulador de Auth.
 * Sus campos no tienen labels asociados, por eso se ubican por id.
 */
export async function signInWithGoogle(page: Page, displayName: string): Promise<string> {
  await page.goto("/");
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Iniciar sesión con Google" }).click();
  const popup = await popupPromise;
  // Si se hace clic antes de que cargue el script del widget, el login no se completa.
  await popup.waitForLoadState("load");
  await popup.locator("#add-account-button").click();
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@gmail.com`;
  await popup.locator("#email-input").fill(email);
  await popup.locator("#display-name-input").fill(displayName);
  await popup.locator("#sign-in").click();

  // En dev, la primera llamada al servidor compila firebase-admin (~20 s en /mnt/c).
  await expect(page.getByText(`Hola, ${displayName}.`)).toBeVisible({ timeout: 45_000 });
  return email;
}

const FIRESTORE_DOCUMENTS =
  "http://localhost:8080/v1/projects/demo-cable-a-tierra/databases/(default)/documents";

/** Crea una organización directo en el emulador (token "owner": saltea las rules). */
export async function seedOrganization(name: string, finishedMatchCount: number): Promise<void> {
  const res = await fetch(`${FIRESTORE_DOCUMENTS}/organizations`, {
    method: "POST",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        name: { stringValue: name },
        nameSort: { stringValue: name.toLowerCase() },
        description: { nullValue: null },
        adminUid: { stringValue: "seed-admin" },
        memberUids: { arrayValue: { values: [{ stringValue: "seed-admin" }] } },
        playerCount: { integerValue: "0" },
        finishedMatchCount: { integerValue: String(finishedMatchCount) },
      },
    }),
  });
  if (!res.ok) throw new Error(`No se pudo sembrar ${name}: ${res.status}`);
}
