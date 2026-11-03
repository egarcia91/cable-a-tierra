import { expect, test } from "@playwright/test";
import { signInWithGoogle } from "./helpers";

test("el admin agrega y edita un jugador/a; un invitado ve solo el apodo (AC-27, AC-18b)", async ({ page, browser }) => {
  test.setTimeout(120_000);
  await signInWithGoogle(page, "Admin Jugadores");

  await page.getByRole("link", { name: "Crear organización" }).click();
  await page.getByLabel("Nombre").fill(`Jugadores ${Date.now()}`);
  await page.getByRole("button", { name: "Crear organización" }).click();
  await expect(page.getByRole("heading", { name: "Jugadores/as (0)" })).toBeVisible({ timeout: 30_000 });
  const organizationUrl = page.url();

  await page.getByRole("link", { name: "Agregar jugador/a" }).click();
  await page.getByLabel("Nombre completo").fill("Juan Pérez");
  await page.getByLabel("Apodo").fill("Juancho");
  await page.getByLabel("Fecha de nacimiento (opcional)").fill("1990-05-10");
  await page.getByRole("button", { name: "Agregar jugador/a" }).click();

  await expect(page.getByRole("heading", { name: "Jugadores/as (1)" })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("ul.players")).toContainText("Juancho");

  await page.getByRole("link", { name: "Editar a Juancho" }).click();
  await expect(page.getByLabel("Nombre completo")).toHaveValue("Juan Pérez");
  await expect(page.getByLabel("Fecha de nacimiento (opcional)")).toHaveValue("1990-05-10");
  await page.getByLabel("Apodo").fill("Juanchi");
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(page.locator("ul.players")).toContainText("Juanchi", { timeout: 30_000 });

  // Otro navegador, sin sesión: ve el apodo pero no puede editar.
  const guest = await browser.newPage();
  await guest.goto(organizationUrl);
  await expect(guest.locator("ul.players")).toContainText("Juanchi");
  await expect(guest.getByRole("link", { name: /Editar/ })).toHaveCount(0);
  await expect(guest.getByRole("link", { name: "Agregar jugador/a" })).toHaveCount(0);
  await expect(guest.getByText("Juan Pérez")).toHaveCount(0);
  await guest.close();
});

test("muestra el error del servidor al crear un jugador/a inválido (AC-90)", async ({ page }) => {
  test.setTimeout(90_000);
  await signInWithGoogle(page, "Admin Invalido");

  await page.getByRole("link", { name: "Crear organización" }).click();
  await page.getByLabel("Nombre").fill(`Invalidos ${Date.now()}`);
  await page.getByRole("button", { name: "Crear organización" }).click();
  await page.getByRole("link", { name: "Agregar jugador/a" }).click({ timeout: 30_000 });

  await page.getByLabel("Nombre completo").fill("   ");
  await page.getByLabel("Apodo").fill("Juancho");
  await page.getByRole("button", { name: "Agregar jugador/a" }).click();

  await expect(page.locator("form").getByRole("alert")).toHaveText("El jugador/a tiene que tener un nombre.", {
    timeout: 30_000,
  });
});
