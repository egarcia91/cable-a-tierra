import { beforeEach, describe, expect, it } from "vitest";
import { registerUser } from "@/app/actions/auth";
import { adminDb } from "@/lib/firebase/admin";
import { clearAuth, clearFirestore } from "../helpers/emulators";
import { googleIdToken, passwordIdToken } from "../helpers/id-tokens";

const pepe = { sub: "google-pepe", email: "Pepe@Gmail.com", name: "Pepe Argento" };

async function userDocs(): Promise<Record<string, unknown>[]> {
  const snap = await adminDb.collection("users").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

beforeEach(async () => {
  await Promise.all([clearFirestore(), clearAuth()]);
});

describe("registerUser", () => {
  it("registra al usuario la primera vez que inicia sesión con Google (AC-09b)", async () => {
    const result = await registerUser(await googleIdToken(pepe));

    expect(result).toEqual({ ok: true });
    const docs = await userDocs();
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ email: "pepe@gmail.com", displayName: "Pepe Argento" });
  });

  it("deja iniciar sesión a un usuario ya registrado sin duplicarlo (AC-09a)", async () => {
    await registerUser(await googleIdToken(pepe));
    const createdAt = (await userDocs())[0].createdAt;

    const result = await registerUser(await googleIdToken(pepe));

    expect(result).toEqual({ ok: true });
    const docs = await userDocs();
    expect(docs).toHaveLength(1);
    expect(docs[0].createdAt).toEqual(createdAt);
  });

  it("rechaza una sesión iniciada con email y contraseña (RF-18)", async () => {
    const result = await registerUser(await passwordIdToken("alguien@gmail.com"));

    expect(result).toEqual({ ok: false, error: "Solo se puede iniciar sesión con Google." });
    expect(await userDocs()).toHaveLength(0);
  });

  it("rechaza un token inválido", async () => {
    const result = await registerUser("token-trucho");

    expect(result.ok).toBe(false);
    expect(await userDocs()).toHaveLength(0);
  });
});
