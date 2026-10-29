import { expect, test, type Page } from "@playwright/test";
import { loginAs } from "./session";

async function addPlayer(page: Page, fullName: string, nickname: string, birthDate: string) {
  await page.getByLabel("Nombre completo").fill(fullName);
  await page.getByLabel("Apodo").fill(nickname);
  await page.getByLabel("Fecha de nacimiento").fill(birthDate);
  await page.getByRole("button", { name: "Agregar jugador/a" }).click();
  await expect(page.getByRole("cell", { name: nickname, exact: true })).toBeVisible();
}

const playerCells = (page: Page, nickname: string) =>
  page.getByRole("row").filter({ has: page.getByRole("cell", { name: nickname, exact: true }) }).getByRole("cell");

test("sin sesión, la única forma de ingresar es con Google (AC-21)", async ({ page }) => {
  await page.goto("/");
  // Dentro de <main>: en modo dev, Next agrega su propio botón flotante.
  await expect(page.getByRole("main").getByRole("button")).toHaveText(["Ingresar con Google"]);
});

test("crear una organización, anotar un partido y ver las estadísticas", async ({ page, context, browser, baseURL }) => {
  await loginAs(context, baseURL!, { name: "Juan Admin", email: "juan@test.com" });
  await page.goto("/");
  await expect(page.getByText("Hola, Juan Admin")).toBeVisible();

  // Organización (AC-10)
  await page.getByRole("link", { name: "Crear organización" }).click();
  await page.getByLabel("Nombre").fill("Los Pibes");
  await page.getByLabel("Descripción").fill("Martes 21 h");
  await page.getByRole("button", { name: "Crear organización" }).click();
  await expect(page.getByRole("heading", { name: "Los Pibes" })).toBeVisible();
  await expect(page.getByText("Sos admin de esta organización.")).toBeVisible();
  const orgUrl = page.url();

  // Jugadores/as (AC-27)
  await addPlayer(page, "Juan Pérez", "Juancho", "1990-05-10");
  await addPlayer(page, "José Gómez", "Pepe", "1988-01-20");

  // Alta del partido con un externo/a (AC-14, AC-55)
  await page.getByRole("link", { name: "Nuevo partido" }).click();
  await page.getByLabel("Lugar").fill("Club Atlético");
  await page.getByRole("radiogroup", { name: "Juancho" }).getByLabel("Equipo A").check();
  await page.getByRole("radiogroup", { name: "Pepe" }).getByLabel("Equipo B").check();
  const teamA = page.getByRole("group", { name: "Equipo A" });
  await teamA.getByLabel("Agregar externo/a (apodo)").fill("Tano");
  await teamA.getByRole("button", { name: "Agregar al equipo A" }).click();
  await expect(teamA.getByText("Tano (externo/a)")).toBeVisible();
  await page.getByRole("button", { name: "Dar de alta el partido" }).click();

  await expect(page.getByText("Pendiente")).toBeVisible();
  await expect(page.getByText("Tano (externo/a)")).toBeVisible(); // AC-23a

  // Finalización: Juancho 2 + Tano 1 contra Pepe 1 → 3 a 1
  await page.getByRole("link", { name: "Finalizar" }).click();
  await page.getByLabel("Juancho").fill("2");
  await page.getByLabel("Tano").fill("1");
  await page.getByLabel("Pepe").fill("1");
  await expect(page.getByText("Resultado: Equipo A 3 – 1 Equipo B")).toBeVisible();
  await page.getByRole("button", { name: "Finalizar partido" }).click();

  await expect(page.getByText("Finalizado: 3 a 1")).toBeVisible(); // AC-16
  await expect(page.getByRole("link", { name: "Finalizar" })).toHaveCount(0);

  // Estadísticas: apodo, nombre, nacimiento, PJ, G, V, E, D (RF-09, RF-10, RF-11)
  await expect(playerCells(page, "Juancho")).toHaveText(["Juancho", "Juan Pérez", "10/05/1990", "1", "2", "1", "0", "0"]);
  await expect(playerCells(page, "Pepe")).toHaveText(["Pepe", "José Gómez", "20/01/1988", "1", "1", "0", "0", "1"]);
  // El externo/a no se suma como jugador/a de la organización (RF-20b)
  await expect(page.getByRole("cell", { name: "Tano", exact: true })).toHaveCount(0);

  // Un invitado ve apodos y estadísticas, pero no datos personales ni acciones de admin (AC-06)
  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  await guestPage.goto(orgUrl);
  await expect(guestPage.getByRole("heading", { name: "Los Pibes" })).toBeVisible();
  await expect(playerCells(guestPage, "Juancho")).toHaveText(["Juancho", "1", "2", "1", "0", "0"]);
  await expect(guestPage.getByText("Juan Pérez")).toHaveCount(0);
  await expect(guestPage.getByText("10/05/1990")).toHaveCount(0);
  await expect(guestPage.getByRole("link", { name: "Nuevo partido" })).toHaveCount(0);
  await guest.close();
});
