import { describe, expect, it } from "vitest";
import { summarizeStreaks } from "./streaks";

const s = (startDate: string, endDate: string, length: number) => ({ startDate, endDate, length });

describe("summarizeStreaks", () => {
  it("sin jugadas, todo en cero", () => {
    expect(summarizeStreaks([], "2026-11-10", "2026-11-09")).toEqual({ current: 0, best: 0 });
  });

  it("la racha sigue viva si jugó ayer", () => {
    const streaks = [s("2026-11-01", "2026-11-05", 5), s("2026-11-08", "2026-11-09", 2)];
    expect(summarizeStreaks(streaks, "2026-11-10", "2026-11-09")).toEqual({ current: 2, best: 5 });
  });

  it("se corta si no jugó ni hoy ni ayer", () => {
    expect(summarizeStreaks([s("2026-11-01", "2026-11-08", 8)], "2026-11-10", "2026-11-09")).toEqual({
      current: 0,
      best: 8,
    });
  });
});
