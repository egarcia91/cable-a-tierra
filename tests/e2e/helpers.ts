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

/** Crea un documento directo en el emulador (token "owner": saltea las rules) y devuelve su id. */
async function seedDocument(
  collectionPath: string,
  fields: Record<string, unknown>,
  documentId?: string,
): Promise<string> {
  const query = documentId ? `?documentId=${documentId}` : "";
  const res = await fetch(`${FIRESTORE_DOCUMENTS}/${collectionPath}${query}`, {
    method: "POST",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`No se pudo sembrar en ${collectionPath}: ${res.status}`);
  const { name } = (await res.json()) as { name: string };
  return name.split("/").pop()!;
}

const int = (value: number) => ({ integerValue: String(value) });

/** Crea una organización directo en el emulador y devuelve su id. */
export function seedOrganization(name: string, finishedMatchCount: number, playerCount = 0): Promise<string> {
  return seedDocument("organizations", {
    name: { stringValue: name },
    nameSort: { stringValue: name.toLowerCase() },
    description: { nullValue: null },
    adminUid: { stringValue: "seed-admin" },
    memberUids: { arrayValue: { values: [{ stringValue: "seed-admin" }] } },
    playerCount: int(playerCount),
    finishedMatchCount: int(finishedMatchCount),
  });
}

type Stats = { matches: number; goals: number; wins: number; draws: number; losses: number };

/** Crea un jugador/a con estadísticas, con su parte pública y la privada. */
export async function seedPlayer(organizationId: string, nickname: string, name: string, stats: Stats): Promise<void> {
  const id = await seedDocument(`organizations/${organizationId}/players`, {
    nickname: { stringValue: nickname },
    nicknameSort: { stringValue: nickname.toLowerCase() },
    linkedUid: { nullValue: null },
    ...Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, int(v)])),
  });
  await seedDocument(
    `organizations/${organizationId}/playersPrivate`,
    { name: { stringValue: name }, birthDate: { nullValue: null } },
    id,
  );
}
