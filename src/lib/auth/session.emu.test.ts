import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { clearAuth, clearFirestore, signInWithGoogle, signUpWithPassword } from "@/test/emulator";
import { startSession, userFromSessionCookie } from "./session";

const juan = { sub: "google-juan", email: "juan@example.com", name: "Juan Pérez" };

describe("sesión", () => {
  beforeEach(async () => {
    await Promise.all([clearAuth(), clearFirestore()]);
  });

  it("el primer login con Google registra al usuario y deja la sesión iniciada (AC-09)", async () => {
    const { idToken, localId } = await signInWithGoogle(juan);

    const cookie = await startSession(idToken);

    const user = await adminDb.doc(`users/${localId}`).get();
    expect(user.data()).toMatchObject({ name: "Juan Pérez", email: "juan@example.com" });
    expect(await userFromSessionCookie(cookie)).toMatchObject({ uid: localId, name: "Juan Pérez" });
  });

  it("un segundo login no pisa el registro", async () => {
    const { idToken, localId } = await signInWithGoogle(juan);
    await startSession(idToken);
    const createdAt = (await adminDb.doc(`users/${localId}`).get()).get("createdAt");

    const second = await signInWithGoogle(juan);
    await startSession(second.idToken);

    expect((await adminDb.doc(`users/${localId}`).get()).get("createdAt")).toEqual(createdAt);
  });

  it("rechaza el login con usuario y contraseña (RF-18)", async () => {
    const { idToken } = await signUpWithPassword("pepe@example.com");
    await expect(startSession(idToken)).rejects.toThrow(/Google/);
  });

  it("rechaza tokens inválidos", async () => {
    await expect(startSession("no-es-un-token")).rejects.toThrow();
  });

  it("sin cookie o con cookie inválida no hay usuario", async () => {
    expect(await userFromSessionCookie(undefined)).toBeNull();
    expect(await userFromSessionCookie("basura")).toBeNull();
  });
});
