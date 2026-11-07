import { beforeEach, describe, expect, it } from "vitest";
import { createOrganizationAction } from "@/app/actions/organizations";
import { createPlayerAction, updatePlayerAction } from "@/app/actions/players";
import { adminDb } from "@/lib/firebase/admin";
import { clearAuth, clearFirestore } from "../helpers/emulators";
import { googleIdToken } from "../helpers/id-tokens";

let adminToken: string;
let otherToken: string;
let organizationId: string;

const juan = { name: "Juan Pérez", nickname: "Juancho", birthDate: "1990-05-10" };

async function player(id: string) {
  const [pub, priv] = await Promise.all([
    adminDb.doc(`organizations/${organizationId}/players/${id}`).get(),
    adminDb.doc(`organizations/${organizationId}/playersPrivate/${id}`).get(),
  ]);
  return { ...pub.data(), ...priv.data() };
}

const playerCount = async () => (await adminDb.doc(`organizations/${organizationId}`).get()).get("playerCount");

async function create(input = juan): Promise<string> {
  const result = await createPlayerAction(adminToken, organizationId, input);
  if (!result.ok) throw new Error(result.error);
  return result.data.id;
}

beforeEach(async () => {
  await Promise.all([clearFirestore(), clearAuth()]);
  adminToken = await googleIdToken({ sub: "google-admin", email: "admin@gmail.com" });
  otherToken = await googleIdToken({ sub: "google-otro", email: "otro@gmail.com" });
  const result = await createOrganizationAction(adminToken, { name: "Los Martes" });
  if (!result.ok) throw new Error(result.error);
  organizationId = result.data.id;
});

describe("crear jugador/a", () => {
  it("queda guardado con sus datos y las estadísticas en 0 (AC-04, AC-27)", async () => {
    const id = await create();

    expect(await player(id)).toMatchObject({
      name: "Juan Pérez",
      nickname: "Juancho",
      birthDate: "1990-05-10",
      matches: 0,
      goals: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      linkedUid: null,
    });
    expect(await playerCount()).toBe(1);
  });

  it("acepta un jugador/a sin fecha de nacimiento (AC-72)", async () => {
    const id = await create({ name: "Juan Pérez", nickname: "Juancho", birthDate: "" });

    expect((await player(id)).birthDate).toBeNull();
  });

  it("rechaza datos inválidos sin crear nada (AC-22b)", async () => {
    const result = await createPlayerAction(adminToken, organizationId, { ...juan, name: "a".repeat(41) });

    expect(result).toEqual({ ok: false, error: "El nombre puede tener hasta 40 caracteres." });
    expect(await playerCount()).toBe(0);
  });

  it("un usuario que no es admin no puede crear jugadores/as (RF-06c)", async () => {
    const result = await createPlayerAction(otherToken, organizationId, juan);

    expect(result).toEqual({ ok: false, error: "Solo el administrador/a de la organización puede hacer esto." });
    expect(await playerCount()).toBe(0);
  });

  it("un invitado no puede crear jugadores/as (RF-04b)", async () => {
    const result = await createPlayerAction(undefined, organizationId, juan);

    expect(result.ok).toBe(false);
  });

  it("con 39 jugadores/as acepta uno más y queda con 40 (AC-36)", async () => {
    await adminDb.doc(`organizations/${organizationId}`).update({ playerCount: 39 });

    await create();

    expect(await playerCount()).toBe(40);
  });

  it("con 40 jugadores/as rechaza otro (AC-37)", async () => {
    await adminDb.doc(`organizations/${organizationId}`).update({ playerCount: 40 });

    const result = await createPlayerAction(adminToken, organizationId, juan);

    expect(result).toEqual({ ok: false, error: "La organización ya tiene 40 jugadores/as." });
    expect(await playerCount()).toBe(40);
  });

  it("no deja pasar de 40 con altas simultáneas", async () => {
    await adminDb.doc(`organizations/${organizationId}`).update({ playerCount: 38 });

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) => createPlayerAction(adminToken, organizationId, { ...juan, nickname: `P${i}` })),
    );

    expect(results.filter((r) => r.ok)).toHaveLength(2);
    expect(await playerCount()).toBe(40);
  });
});

describe("editar jugador/a", () => {
  it("cambia nombre, apodo y fecha de nacimiento (AC-18a, AC-18b, AC-18c)", async () => {
    const id = await create();

    const result = await updatePlayerAction(adminToken, organizationId, id, {
      name: "Juan Gómez",
      nickname: "Juanchi",
      birthDate: "1990-05-11",
    });

    expect(result.ok).toBe(true);
    expect(await player(id)).toMatchObject({ name: "Juan Gómez", nickname: "Juanchi", birthDate: "1990-05-11" });
  });

  it("no toca las estadísticas aunque el cliente las mande (RF-22)", async () => {
    const id = await create();

    await updatePlayerAction(adminToken, organizationId, id, { ...juan, goals: 100 } as never);

    expect((await player(id)).goals).toBe(0);
  });

  it("un usuario que no es admin no puede editarlo (AC-05b)", async () => {
    const id = await create();

    const result = await updatePlayerAction(otherToken, organizationId, id, { ...juan, nickname: "Hackeado" });

    expect(result.ok).toBe(false);
    expect((await player(id)).nickname).toBe("Juancho");
  });

  it("rechaza editar un jugador/a que no existe", async () => {
    const result = await updatePlayerAction(adminToken, organizationId, "no-existe", juan);

    expect(result).toEqual({ ok: false, error: "El jugador/a no existe." });
  });
});
