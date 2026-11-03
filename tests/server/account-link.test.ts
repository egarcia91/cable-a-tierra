import { beforeEach, describe, expect, it } from "vitest";
import { registerUser } from "@/app/actions/auth";
import { createOrganizationAction } from "@/app/actions/organizations";
import { createPlayerAction, linkPlayerAccountAction } from "@/app/actions/players";
import { adminDb } from "@/lib/firebase/admin";
import { clearAuth, clearFirestore } from "../helpers/emulators";
import { googleIdToken } from "../helpers/id-tokens";

type Account = { token: string; uid: string };

/** Registra una cuenta de Google como lo hace la app al iniciar sesión. */
async function registerAccount(email: string): Promise<Account> {
  const token = await googleIdToken({ sub: `google-${email}`, email });
  await registerUser(token);
  const uid = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).user_id;
  return { token, uid };
}

async function createOrganization(admin: Account, name: string): Promise<string> {
  const result = await createOrganizationAction(admin.token, { name });
  if (!result.ok) throw new Error(result.error);
  return result.data.id;
}

async function createPlayer(admin: Account, organizationId: string, nickname: string): Promise<string> {
  const result = await createPlayerAction(admin.token, organizationId, { name: `${nickname} Pérez`, nickname });
  if (!result.ok) throw new Error(result.error);
  return result.data.id;
}

const playerDoc = (organizationId: string, playerId: string) =>
  adminDb.doc(`organizations/${organizationId}/players/${playerId}`).get();
const memberUids = async (organizationId: string) =>
  (await adminDb.doc(`organizations/${organizationId}`).get()).get("memberUids") as string[];

let admin: Account;
let pepe: Account;
let organizationId: string;

beforeEach(async () => {
  await Promise.all([clearFirestore(), clearAuth()]);
  admin = await registerAccount("admin@gmail.com");
  pepe = await registerAccount("pepe@gmail.com");
  organizationId = await createOrganization(admin, "Los Martes");
});

describe("asociar una cuenta a un jugador/a", () => {
  it("asocia la cuenta registrada con ese email y la suma a los miembros (AC-28)", async () => {
    const playerId = await createPlayer(admin, organizationId, "Pepe");

    const result = await linkPlayerAccountAction(admin.token, organizationId, playerId, { email: "pepe@gmail.com" });

    expect(result.ok).toBe(true);
    expect((await playerDoc(organizationId, playerId)).get("linkedUid")).toBe(pepe.uid);
    expect(await memberUids(organizationId)).toEqual([admin.uid, pepe.uid]);
  });

  it("encuentra la cuenta aunque el email venga con mayúsculas o espacios", async () => {
    const playerId = await createPlayer(admin, organizationId, "Pepe");

    const result = await linkPlayerAccountAction(admin.token, organizationId, playerId, { email: " Pepe@Gmail.COM " });

    expect(result.ok).toBe(true);
  });

  it("rechaza un email que no corresponde a ninguna cuenta registrada (AC-84)", async () => {
    const playerId = await createPlayer(admin, organizationId, "Pepe");

    const result = await linkPlayerAccountAction(admin.token, organizationId, playerId, { email: "nadie@gmail.com" });

    expect(result).toEqual({ ok: false, error: "No hay ninguna cuenta registrada con ese email." });
    expect((await playerDoc(organizationId, playerId)).get("linkedUid")).toBeNull();
  });

  it("rechaza asociar una cuenta ya asociada a otro jugador/a de la misma organización (AC-12)", async () => {
    const first = await createPlayer(admin, organizationId, "Pepe");
    const second = await createPlayer(admin, organizationId, "Otro");
    await linkPlayerAccountAction(admin.token, organizationId, first, { email: "pepe@gmail.com" });

    const result = await linkPlayerAccountAction(admin.token, organizationId, second, { email: "pepe@gmail.com" });

    expect(result).toEqual({ ok: false, error: "Esa cuenta ya está asociada a otro jugador/a de esta organización." });
    expect((await playerDoc(organizationId, second)).get("linkedUid")).toBeNull();
  });

  it("rechaza asociar otra cuenta a un jugador/a que ya tiene una (AC-13)", async () => {
    await registerAccount("jose@gmail.com");
    const playerId = await createPlayer(admin, organizationId, "Pepe");
    await linkPlayerAccountAction(admin.token, organizationId, playerId, { email: "pepe@gmail.com" });

    const result = await linkPlayerAccountAction(admin.token, organizationId, playerId, { email: "jose@gmail.com" });

    expect(result).toEqual({ ok: false, error: "El jugador/a ya tiene una cuenta asociada." });
    expect((await playerDoc(organizationId, playerId)).get("linkedUid")).toBe(pepe.uid);
  });

  it("permite la misma cuenta en jugadores/as de distintas organizaciones (AC-25)", async () => {
    const adminB = await registerAccount("admin-b@gmail.com");
    const organizationB = await createOrganization(adminB, "Los Jueves");
    const pepeInA = await createPlayer(admin, organizationId, "Pepe");
    const joseInB = await createPlayer(adminB, organizationB, "José");
    await linkPlayerAccountAction(admin.token, organizationId, pepeInA, { email: "pepe@gmail.com" });

    const result = await linkPlayerAccountAction(adminB.token, organizationB, joseInB, { email: "pepe@gmail.com" });

    expect(result.ok).toBe(true);
    expect((await playerDoc(organizationId, pepeInA)).get("nickname")).toBe("Pepe");
    expect((await playerDoc(organizationB, joseInB)).get("nickname")).toBe("José");
    expect((await playerDoc(organizationB, joseInB)).get("linkedUid")).toBe(pepe.uid);
  });

  it("un usuario que no es admin no puede asociar cuentas (RF-06c)", async () => {
    const playerId = await createPlayer(admin, organizationId, "Pepe");

    const result = await linkPlayerAccountAction(pepe.token, organizationId, playerId, { email: "pepe@gmail.com" });

    expect(result).toEqual({ ok: false, error: "Solo el administrador/a de la organización puede hacer esto." });
    expect(await memberUids(organizationId)).toEqual([admin.uid]);
  });

  it("dos asociaciones simultáneas de la misma cuenta: solo una gana (RF-07c)", async () => {
    const first = await createPlayer(admin, organizationId, "Pepe");
    const second = await createPlayer(admin, organizationId, "Otro");

    const results = await Promise.all([
      linkPlayerAccountAction(admin.token, organizationId, first, { email: "pepe@gmail.com" }),
      linkPlayerAccountAction(admin.token, organizationId, second, { email: "pepe@gmail.com" }),
    ]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const linked = await Promise.all([first, second].map(async (id) => (await playerDoc(organizationId, id)).get("linkedUid")));
    expect(linked.filter(Boolean)).toEqual([pepe.uid]);
  });
});
