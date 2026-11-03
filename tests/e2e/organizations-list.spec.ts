import { expect, test } from "@playwright/test";
import { seedOrganization } from "./helpers";

// Nombres únicos por ejecución y cantidades que crecen con el tiempo: así las
// organizaciones sembradas en esta ejecución quedan primeras aunque haya otras
// (de otros tests o de repeticiones anteriores en la misma corrida).
const runId = () => Math.random().toString(36).slice(2, 7);
const band = () => Math.floor(Date.now() / 1000) * 100;

test("un invitado ve el listado de a 10 y puede ver las siguientes (AC-19, AC-52, AC-86)", async ({ page }) => {
  const id = runId();
  const base = band();
  // AC-86: con 25 organizaciones se ven 10 y, al pedir las siguientes, 20.
  await Promise.all(
    Array.from({ length: 25 }, (_, i) => seedOrganization(`Lista ${id} ${String(i + 1).padStart(2, "0")}`, base + i + 1)),
  );

  await page.goto("/");
  await page.getByRole("link", { name: "Ingresar como invitado" }).click();

  const items = page.locator("ol.organizations > li");
  await expect(items).toHaveCount(10);
  await expect(items.first()).toContainText(`Lista ${id} 25`);

  await page.getByRole("button", { name: "Ver 10 más" }).click();

  await expect(items).toHaveCount(20);
  await expect(items.nth(19)).toContainText(`Lista ${id} 06`);
});

test("desde el listado se entra a una organización", async ({ page }) => {
  const name = `Para Entrar ${runId()}`;
  await seedOrganization(name, band() + 50);

  await page.goto("/organizaciones");
  await page.getByRole("link", { name }).click();

  await expect(page.getByRole("heading", { name })).toBeVisible();
});
