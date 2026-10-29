import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "./admin";
import { clearFirestore } from "@/test/emulator";

describe("Admin SDK contra el emulador", () => {
  beforeEach(clearFirestore);

  it("escribe y lee un documento", async () => {
    await adminDb.doc("smoke/doc").set({ ok: true });
    const snap = await adminDb.doc("smoke/doc").get();
    expect(snap.data()).toEqual({ ok: true });
  });
});
