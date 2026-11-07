import { beforeEach, describe, expect, it } from "vitest";
import { createOrganizationAction, updateOrganizationAction } from "@/app/actions/organizations";
import { adminDb } from "@/lib/firebase/admin";
import { clearAuth, clearFirestore } from "../helpers/emulators";
import { googleIdToken } from "../helpers/id-tokens";

let adminToken: string;
let adminUid: string;
let otherToken: string;

async function organization(id: string) {
  return (await adminDb.doc(`organizations/${id}`).get()).data();
}

async function createLosMartes(): Promise<string> {
  const result = await createOrganizationAction(adminToken, {
    name: "Los Martes",
    description: "Fútbol los martes en Palermo",
  });
  if (!result.ok) throw new Error(result.error);
  return result.data.id;
}

beforeEach(async () => {
  await Promise.all([clearFirestore(), clearAuth()]);
  adminToken = await googleIdToken({ sub: "google-admin", email: "admin@gmail.com" });
  adminUid = JSON.parse(Buffer.from(adminToken.split(".")[1], "base64url").toString()).user_id;
  otherToken = await googleIdToken({ sub: "google-otro", email: "otro@gmail.com" });
});

describe("crear organización", () => {
  it("queda creada con quien la crea como admin (AC-10a, AC-10b)", async () => {
    const id = await createLosMartes();

    expect(await organization(id)).toMatchObject({
      name: "Los Martes",
      description: "Fútbol los martes en Palermo",
      adminUid,
      memberUids: [adminUid],
      playerCount: 0,
      finishedMatchCount: 0,
    });
  });

  it("acepta una organización sin descripción (AC-78)", async () => {
    const result = await createOrganizationAction(adminToken, { name: "Los Martes" });

    expect(result.ok).toBe(true);
    if (result.ok) expect((await organization(result.data.id))?.description).toBeNull();
  });

  it("rechaza una organización sin nombre (AC-75)", async () => {
    const result = await createOrganizationAction(adminToken, { name: "   " });

    expect(result).toEqual({ ok: false, error: "La organización tiene que tener un nombre." });
    expect((await adminDb.collection("organizations").get()).size).toBe(0);
  });

  it("rechaza un nombre de 41 caracteres (AC-77)", async () => {
    const result = await createOrganizationAction(adminToken, { name: "a".repeat(41) });

    expect(result.ok).toBe(false);
  });

  it("rechaza la creación de un invitado (AC-49)", async () => {
    const result = await createOrganizationAction(undefined, { name: "Los Martes" });

    expect(result).toEqual({ ok: false, error: "Tenés que iniciar sesión." });
    expect((await adminDb.collection("organizations").get()).size).toBe(0);
  });

  it("ignora un adminUid enviado por el cliente: el admin es siempre quien crea (AC-59)", async () => {
    const result = await createOrganizationAction(adminToken, {
      name: "Los Martes",
      adminUid: "otra-cuenta",
    } as never);

    expect(result.ok).toBe(true);
    if (result.ok) expect((await organization(result.data.id))?.adminUid).toBe(adminUid);
  });
});

describe("editar organización", () => {
  it("el admin cambia el nombre (AC-34a)", async () => {
    const id = await createLosMartes();

    const result = await updateOrganizationAction(adminToken, id, {
      name: "Los Miércoles",
      description: "Fútbol los martes en Palermo",
    });

    expect(result.ok).toBe(true);
    expect((await organization(id))?.name).toBe("Los Miércoles");
  });

  it("el admin cambia la descripción (AC-34b)", async () => {
    const id = await createLosMartes();

    await updateOrganizationAction(adminToken, id, {
      name: "Los Martes",
      description: "Fútbol los miércoles en Palermo",
    });

    expect((await organization(id))?.description).toBe("Fútbol los miércoles en Palermo");
  });

  it("un usuario que no es admin no puede editarla (RF-06f)", async () => {
    const id = await createLosMartes();

    const result = await updateOrganizationAction(otherToken, id, { name: "Hackeada" });

    expect(result).toEqual({ ok: false, error: "Solo el administrador/a puede editar esta organización." });
    expect((await organization(id))?.name).toBe("Los Martes");
  });

  it("un invitado no puede editarla", async () => {
    const id = await createLosMartes();

    const result = await updateOrganizationAction(undefined, id, { name: "Hackeada" });

    expect(result.ok).toBe(false);
    expect((await organization(id))?.name).toBe("Los Martes");
  });

  it("rechaza editar una organización que no existe", async () => {
    const result = await updateOrganizationAction(adminToken, "no-existe", { name: "Los Martes" });

    expect(result).toEqual({ ok: false, error: "La organización no existe." });
  });

  it("aplica las mismas validaciones que al crear", async () => {
    const id = await createLosMartes();

    const result = await updateOrganizationAction(adminToken, id, { name: "Los Martes", description: "a".repeat(201) });

    expect(result).toEqual({ ok: false, error: "La descripción puede tener hasta 200 caracteres." });
    expect((await organization(id))?.description).toBe("Fútbol los martes en Palermo");
  });
});
