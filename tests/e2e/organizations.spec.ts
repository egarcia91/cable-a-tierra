import { expect, test } from "@playwright/test";
import { signInWithGoogle } from "./helpers";

test("crear y editar una organización (AC-10a, AC-34a, AC-34b, AC-20a)", async ({ page }) => {
  test.setTimeout(90_000);
  await signInWithGoogle(page, "Admin E2E");

  await page.getByRole("link", { name: "Crear organización" }).click();
  await page.getByLabel("Nombre").fill("Los Martes");
  await page.getByLabel("Descripción (opcional)").fill("Fútbol los martes en Palermo");
  await page.getByRole("button", { name: "Crear organización" }).click();

  await expect(page.getByRole("heading", { name: "Los Martes" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Fútbol los martes en Palermo")).toBeVisible();
  await expect(page.getByRole("button", { name: /eliminar/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /eliminar/i })).toHaveCount(0);

  await page.getByRole("link", { name: "Editar organización" }).click();
  await page.getByLabel("Nombre").fill("Los Miércoles");
  await page.getByLabel("Descripción (opcional)").fill("Fútbol los miércoles en Palermo");
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(page.getByRole("heading", { name: "Los Miércoles" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Fútbol los miércoles en Palermo")).toBeVisible();
});

test("muestra el error del servidor si el nombre es solo espacios (RF-19l)", async ({ page }) => {
  test.setTimeout(60_000);
  await signInWithGoogle(page, "Admin E2E");

  await page.goto("/organizaciones/nueva");
  await page.getByLabel("Nombre").fill("   ");
  await page.getByRole("button", { name: "Crear organización" }).click();

  // Se busca dentro del form: Next agrega su propio role="alert" (anunciador de rutas).
  await expect(page.locator("form").getByRole("alert")).toHaveText("La organización tiene que tener un nombre.", {
    timeout: 30_000,
  });
});

test("un invitado no ve el formulario para crear una organización", async ({ page }) => {
  await page.goto("/organizaciones/nueva");

  await expect(page.getByText("Para crear una organización tenés que iniciar sesión.")).toBeVisible();
  await expect(page.getByLabel("Nombre")).toHaveCount(0);
});
