import { expect, test, type APIRequestContext } from "@playwright/test";
import { signInWithGoogle } from "./helpers";

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

  const email = await signInWithGoogle(page, "Juancho E2E");
  expect(await registeredEmails(request)).toContain(email);

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("button", { name: "Iniciar sesión con Google" })).toBeVisible();
});
