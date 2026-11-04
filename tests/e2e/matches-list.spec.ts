import { expect, test } from "@playwright/test";
import { seedMatch, seedOrganization } from "./helpers";

test("un invitado ve los partidos de a 10, del más reciente, con su estado (AC-16a, AC-16b, AC-85)", async ({ page }) => {
  const organizationId = await seedOrganization(`Con Partidos ${Date.now()}`, 0);
  // 25 partidos, uno por día de enero; el del 25 está pendiente y el resto finalizados.
  await Promise.all(
    Array.from({ length: 25 }, (_, i) =>
      seedMatch(organizationId, `2026-01-${String(i + 1).padStart(2, "0")}`, i === 24 ? "pending" : "finished"),
    ),
  );

  await page.goto(`/organizaciones/${organizationId}`);

  const items = page.locator("ol.matches > li");
  await expect(items).toHaveCount(10);
  await expect(items.nth(0)).toContainText("25/01/2026 · Cancha del 2026-01-25");
  await expect(items.nth(0)).toContainText("Pendiente");
  await expect(items.nth(1)).toContainText("24/01/2026");
  await expect(items.nth(1)).toContainText("Finalizado 2 – 1");

  await page.getByRole("button", { name: "Ver 10 más" }).click();

  await expect(items).toHaveCount(20);
  await expect(items.nth(19)).toContainText("06/01/2026");

  await page.getByRole("button", { name: "Ver 10 más" }).click();
  await expect(items).toHaveCount(25);
  await expect(page.getByRole("button", { name: "Ver 10 más" })).toHaveCount(0);

  await items.nth(1).getByRole("link").click();
  await expect(page.getByRole("heading", { name: "Partido del 24/01/2026" })).toBeVisible();
  await expect(page.getByLabel("Marcador")).toHaveText("Equipo A 2 – 1 Equipo B");
});
