import { expect, test } from "@playwright/test";
import { addPlayerViaUi, createOrganizationViaUi, signInWithGoogle } from "./helpers";

test("el admin da de alta y edita un partido pendiente (AC-14, AC-55, AC-23a, AC-50a, AC-50c)", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  await signInWithGoogle(page, "Admin Partidos");
  await createOrganizationViaUi(page, `Partidos ${Date.now()}`);
  await addPlayerViaUi(page, "Juan Pérez", "Juancho");
  await addPlayerViaUi(page, "Alberto Díaz", "Beto");

  await page.getByRole("link", { name: "Dar de alta un partido" }).click();
  await page.getByLabel("Día").fill("2026-03-17");
  await page.getByLabel("Lugar").fill("Cancha 1");
  await page.getByLabel("Juancho").selectOption("A");
  await page.getByLabel("Beto").selectOption("B");
  await page.getByLabel("Apodo del externo/a para el equipo A").fill("Tano");
  await page.getByRole("button", { name: "Agregar al equipo A" }).click();
  await page.getByRole("button", { name: "Dar de alta el partido" }).click();

  await expect(page.getByRole("heading", { name: "Partido del 17/03/2026" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Cancha 1 · Pendiente")).toBeVisible();
  const teamA = page.locator("section", { has: page.getByRole("heading", { name: "Equipo A" }) });
  const teamB = page.locator("section", { has: page.getByRole("heading", { name: "Equipo B" }) });
  await expect(teamA).toContainText("Juancho");
  await expect(teamA).toContainText("Tano (externo/a)");
  await expect(teamB).toContainText("Beto");
  const matchUrl = page.url();

  await page.getByRole("link", { name: "Editar partido" }).click();
  await page.getByLabel("Lugar").fill("Cancha 2");
  await page.getByLabel("Juancho").selectOption("B");
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(page.getByText("Cancha 2 · Pendiente")).toBeVisible({ timeout: 30_000 });
  await expect(teamB).toContainText("Juancho");
  await expect(teamA).not.toContainText("Juancho");

  // Un invitado ve el partido pero no puede editarlo (AC-16b).
  const guest = await browser.newPage();
  await guest.goto(matchUrl);
  await expect(guest.getByText("Cancha 2 · Pendiente")).toBeVisible();
  await expect(guest.getByRole("link", { name: "Editar partido" })).toHaveCount(0);
  await guest.close();
});

test("muestra el error del servidor si un equipo queda vacío (AC-54)", async ({ page }) => {
  test.setTimeout(90_000);
  await signInWithGoogle(page, "Admin Vacio");
  await createOrganizationViaUi(page, `Vacio ${Date.now()}`);
  await addPlayerViaUi(page, "Juan Pérez", "Juancho");

  await page.getByRole("link", { name: "Dar de alta un partido" }).click();
  await page.getByLabel("Lugar").fill("Cancha 1");
  await page.getByLabel("Juancho").selectOption("A");
  await page.getByRole("button", { name: "Dar de alta el partido" }).click();

  await expect(page.locator("form").getByRole("alert")).toHaveText("El equipo B tiene que tener al menos 1 jugador/a.", {
    timeout: 30_000,
  });
});
