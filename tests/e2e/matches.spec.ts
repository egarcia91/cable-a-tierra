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

test("el admin finaliza un partido y se suman las estadísticas (AC-53, AC-15, AC-23c, AC-01, AC-02, AC-03a)", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signInWithGoogle(page, "Admin Finaliza");
  await createOrganizationViaUi(page, `Finaliza ${Date.now()}`);
  const organizationUrl = page.url();
  await addPlayerViaUi(page, "Juan Pérez", "Juancho");
  await addPlayerViaUi(page, "Alberto Díaz", "Beto");

  // El día arranca en hoy, así que se puede finalizar enseguida.
  await page.getByRole("link", { name: "Dar de alta un partido" }).click();
  await page.getByLabel("Lugar").fill("Cancha 1");
  await page.getByLabel("Juancho").selectOption("A");
  await page.getByLabel("Beto").selectOption("B");
  await page.getByLabel("Apodo del externo/a para el equipo A").fill("Tano");
  await page.getByRole("button", { name: "Agregar al equipo A" }).click();
  await page.getByRole("button", { name: "Dar de alta el partido" }).click();
  await page.getByRole("link", { name: "Finalizar partido" }).click({ timeout: 30_000 });

  await page.getByLabel("Goles de Juancho", { exact: true }).fill("2");
  await page.getByLabel("Goles de Tano (externo/a)", { exact: true }).fill("1");
  await page.getByLabel("Goles en contra de Juancho").fill("1");
  await expect(page.getByLabel("Marcador")).toHaveText("Equipo A 3 – 1 Equipo B");
  await page.getByRole("button", { name: "Finalizar partido" }).click();

  await expect(page.getByText("Cancha 1 · Finalizado")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel("Marcador")).toHaveText("Equipo A 3 – 1 Equipo B");
  await expect(page.getByText("Juancho · 2 goles, 1 en contra")).toBeVisible();
  await expect(page.getByRole("link", { name: "Finalizar partido" })).toHaveCount(0);

  // PJ, G, V, E, D: Juancho ganó con 2 goles; el gol en contra no le cuenta a Beto.
  await page.goto(organizationUrl);
  const cells = (nickname: string) =>
    page.locator("table.players tbody tr", { hasText: nickname }).locator("td");
  await expect(cells("Juancho")).toHaveText(["1", "2", "1", "0", "0"]);
  await expect(cells("Beto")).toHaveText(["1", "0", "0", "0", "1"]);
  // El externo/a no queda como jugador/a de la organización (AC-23b).
  await expect(page.locator("table.players tbody tr")).toHaveCount(2);
});

test("el admin corrige un partido finalizado y se recalculan las estadísticas (AC-51a, AC-51c, AC-92)", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  await signInWithGoogle(page, "Admin Corrige");
  await createOrganizationViaUi(page, `Corrige ${Date.now()}`);
  const organizationUrl = page.url();
  await addPlayerViaUi(page, "Juan Pérez", "Juancho");
  await addPlayerViaUi(page, "Alberto Díaz", "Beto");

  await page.getByRole("link", { name: "Dar de alta un partido" }).click();
  await page.getByLabel("Lugar").fill("Cancha 1");
  await page.getByLabel("Juancho").selectOption("A");
  await page.getByLabel("Beto").selectOption("B");
  await page.getByRole("button", { name: "Dar de alta el partido" }).click();
  await page.getByRole("link", { name: "Finalizar partido" }).click({ timeout: 30_000 });
  await page.getByLabel("Goles de Juancho", { exact: true }).fill("2");
  await page.getByLabel("Goles de Beto", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Finalizar partido" }).click();
  // El formulario también muestra el marcador: se espera a volver a la página del partido.
  await expect(page.getByText("Cancha 1 · Finalizado")).toBeVisible({ timeout: 30_000 });
  const matchUrl = page.url();

  // Juancho pasa a 1 gol (1 a 1), se corrige el lugar y se suma a Tano con 1 gol (2 a 1).
  await page.getByRole("link", { name: "Corregir partido" }).click();
  await expect(page.getByLabel("Goles de Juancho", { exact: true })).toHaveValue("2");
  await page.getByLabel("Lugar").fill("Cancha 2");
  await page.getByLabel("Goles de Juancho", { exact: true }).fill("1");
  await expect(page.getByLabel("Marcador")).toHaveText("Equipo A 1 – 1 Equipo B");
  await page.getByLabel("Apodo del externo/a para el equipo A").fill("Tano");
  await page.getByRole("button", { name: "Agregar al equipo A" }).click();
  await page.getByLabel("Goles de Tano (externo/a)", { exact: true }).fill("1");
  await expect(page.getByLabel("Marcador")).toHaveText("Equipo A 2 – 1 Equipo B");
  await page.getByRole("button", { name: "Guardar corrección" }).click();

  await expect(page.getByText("Cancha 2 · Finalizado")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Tano (externo/a) · 1 gol")).toBeVisible();

  await page.goto(organizationUrl);
  const cells = (nickname: string) =>
    page.locator("table.players tbody tr", { hasText: nickname }).locator("td");
  await expect(cells("Juancho")).toHaveText(["1", "1", "1", "0", "0"]);
  await expect(cells("Beto")).toHaveText(["1", "1", "0", "0", "1"]);
  await expect(page.locator("table.players tbody tr")).toHaveCount(2);

  // Un invitado ve el partido corregido pero no puede corregirlo.
  const guest = await browser.newPage();
  await guest.goto(matchUrl);
  await expect(guest.getByText("Cancha 2 · Finalizado")).toBeVisible();
  await expect(guest.getByRole("link", { name: "Corregir partido" })).toHaveCount(0);
  await guest.close();
});
