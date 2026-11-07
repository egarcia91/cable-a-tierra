import { describe, expect, it } from "vitest";
import { todayInArgentina } from "./dates";

describe("todayInArgentina", () => {
  it("usa la hora de Argentina (UTC-3) y no la UTC", () => {
    // 02:00 UTC del 11/03 son las 23:00 del 10/03 en Argentina.
    expect(todayInArgentina(new Date("2026-03-11T02:00:00Z"))).toBe("2026-03-10");
  });

  it("cambia de día a la medianoche de Argentina", () => {
    expect(todayInArgentina(new Date("2026-03-11T03:00:00Z"))).toBe("2026-03-11");
  });
});
