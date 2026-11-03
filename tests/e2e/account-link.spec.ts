import { expect, test } from "@playwright/test";
import { signInWithGoogle } from "./helpers";

test("el admin asocia la cuenta de un usuario registrado a un jugador/a (AC-28, AC-84)", async ({ page, browser }) => {
  test.setTimeout(120_000);

  // Pepe entra a la app en su propio navegador: así queda registrado.
  const pepePage = await (await browser.newContext()).newPage();
  const pepeEmail = await signInWithGoogle(pepePage, "Pepe E2E");
  await pepePage.close();

  await signInWithGoogle(page, "Admin Cuentas");
  await page.getByRole("link", { name: "Crear organización" }).click();
  await page.getByLabel("Nombre").fill(`Cuentas ${Date.now()}`);
  await page.getByRole("button", { name: "Crear organización" }).click();
  await page.getByRole("link", { name: "Agregar jugador/a" }).click({ timeout: 30_000 });
  await page.getByLabel("Nombre completo").fill("Pepe Argento");
  await page.getByLabel("Apodo").fill("Pepe");
  await page.getByRole("button", { name: "Agregar jugador/a" }).click();
  await page.getByRole("link", { name: "Editar a Pepe" }).click({ timeout: 30_000 });

  await page.getByLabel("Email de Google").fill("nadie@gmail.com");
  await page.getByRole("button", { name: "Asociar cuenta" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("No hay ninguna cuenta registrada con ese email.", {
    timeout: 30_000,
  });

  await page.getByLabel("Email de Google").fill(pepeEmail);
  await page.getByRole("button", { name: "Asociar cuenta" }).click();
  await expect(page.getByText("Este jugador/a ya tiene una cuenta asociada.")).toBeVisible();

  await page.goBack();
  await expect(page.locator("ul.players")).toContainText("Pepe · con cuenta");
});
