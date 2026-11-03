import { expect, test, type APIRequestContext } from "@playwright/test";

// Lee users/ directo del emulador con el token "owner", que saltea las rules.
async function registeredEmails(request: APIRequestContext): Promise<string[]> {
  const res = await request.get(
    "http://localhost:8080/v1/projects/demo-cable-a-tierra/databases/(default)/documents/users",
    { headers: { Authorization: "Bearer owner" } },
  );
  const body = (await res.json()) as { documents?: { fields: { email: { stringValue: string } } }[] };
  return (body.documents ?? []).map((d) => d.fields.email.stringValue);
}

test("la pantalla de ingreso solo ofrece Google o invitado (AC-21)", async ({ page }) => {
  await page.goto("/");

  const options = page.locator("section.login").getByRole("button").or(page.locator("section.login").getByRole("link"));
  await expect(options).toHaveText(["Iniciar sesión con Google", "Ingresar como invitado"]);
  await expect(page.getByLabel(/contraseña/i)).toHaveCount(0);
});

test("ingresar como invitado lleva a las organizaciones sin iniciar sesión (AC-52)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Ingresar como invitado" }).click();

  await expect(page).toHaveURL("/organizaciones");
  await expect(page.getByRole("heading", { name: "Organizaciones" })).toBeVisible();
});

test("iniciar y cerrar sesión con Google (AC-09b)", async ({ page, request }) => {
  test.setTimeout(60_000);
  await page.goto("/");

  // El emulador de Auth abre su propio selector de cuentas de Google. Sus
  // campos no tienen labels asociados, por eso se ubican por id.
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Iniciar sesión con Google" }).click();
  const popup = await popupPromise;
  // Si se hace clic antes de que cargue el script del widget, el login no se completa.
  await popup.waitForLoadState("load");
  await popup.locator("#add-account-button").click();
  const email = `e2e-${Date.now()}@gmail.com`;
  await popup.locator("#email-input").fill(email);
  await popup.locator("#display-name-input").fill("Juancho E2E");
  await popup.locator("#sign-in").click();

  // En dev, la primera llamada al servidor compila firebase-admin (~20 s en /mnt/c).
  await expect(page.getByText("Hola, Juancho E2E.")).toBeVisible({ timeout: 45_000 });
  expect(await registeredEmails(request)).toContain(email);

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("button", { name: "Iniciar sesión con Google" })).toBeVisible();
});
