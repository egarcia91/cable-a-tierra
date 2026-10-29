import { beforeEach, describe, expect, it } from "vitest";
import { clearFirestore } from "@/test/emulator";
import { createOrganization, getOrganization } from "./organizations";

describe("organizaciones", () => {
  beforeEach(clearFirestore);

  it("quien la crea queda como admin (AC-10) y se consulta con su nombre y descripción (AC-11)", async () => {
    const id = await createOrganization("uid-juan", { name: "Los Pibes", description: "Martes 21 h" });

    expect(await getOrganization(id)).toEqual({
      id,
      name: "Los Pibes",
      description: "Martes 21 h",
      adminUid: "uid-juan",
      playerCount: 0,
      finishedMatchCount: 0,
    });
  });

  it("valida los datos antes de guardar", async () => {
    await expect(createOrganization("uid-juan", { name: "", description: "" })).rejects.toThrow(/obligatorio/);
  });

  it("devuelve null si no existe", async () => {
    expect(await getOrganization("no-existe")).toBeNull();
  });
});
