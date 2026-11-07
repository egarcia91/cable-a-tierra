import { expect, test } from "@playwright/test";
import { seedOrganization, seedPlayer } from "./helpers";

test("un invitado ve los jugadores/as con estadísticas y puede ordenarlos (AC-17b, AC-87, AC-07, AC-88)", async ({ page }) => {
  const organizationId = await seedOrganization(`Ranking ${Date.now()}`, 0, 3);
  await seedPlayer(organizationId, "Tano", "Gaetano Rossi", { matches: 5, goals: 4, wins: 3, draws: 1, losses: 1 });
  await seedPlayer(organizationId, "Beto", "Alberto Díaz", { matches: 3, goals: 4, wins: 1, draws: 1, losses: 1 });
  await seedPlayer(organizationId, "Lucho", "Luis Gómez", { matches: 8, goals: 1, wins: 2, draws: 3, losses: 3 });

  await page.goto(`/organizaciones/${organizationId}`);
  const rows = page.locator("table.players tbody tr");

  // Por defecto, por partidos (AC-87).
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText("Lucho");
  await expect(rows.nth(1)).toContainText("Tano");
  await expect(rows.nth(2)).toContainText("Beto");

  // Por goles: Tano y Beto empatan en 4 y se desempata por apodo (AC-07, AC-88).
  await page.getByLabel("Ordenar por").selectOption("goals");
  await expect(rows.nth(0)).toContainText("Beto");
  await expect(rows.nth(1)).toContainText("Tano");
  await expect(rows.nth(2)).toContainText("Lucho");

  // Un invitado nunca ve los nombres completos (AC-06).
  await expect(page.locator("table.players")).not.toContainText("Gaetano Rossi");
  await expect(page.locator("table.players")).not.toContainText("Alberto Díaz");
});
