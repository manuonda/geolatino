import { describe, expect, it } from "vitest";
import { addDays, buildCalendar, dayState, missingDays, type SlotQuestion } from "./calendar";

const slot = (position: number, status = "approved"): SlotQuestion => ({
  id: `Q${position}`,
  placeName: "Lugar",
  status,
  position,
});

describe("addDays", () => {
  it("cruza fin de mes y de año", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("dayState", () => {
  it("completo solo con 5 aprobadas", () => {
    expect(dayState([1, 2, 3, 4, 5].map((p) => slot(p)))).toBe("complete");
    expect(dayState([slot(1), slot(2), slot(3), slot(4), slot(5, "ai_reviewed")])).toBe("incomplete");
    expect(dayState([slot(1), null, null, null, null])).toBe("incomplete");
    expect(dayState([null, null, null, null, null])).toBe("empty");
  });
});

describe("buildCalendar y missingDays", () => {
  it("ubica cada pregunta en su día y lugar, y lista los días incompletos de la semana", () => {
    const full = [1, 2, 3, 4, 5].map((p) => ({ ...slot(p), roundDate: "2026-11-01" }));
    const calendar = buildCalendar("2026-11-01", 14, [...full, { ...slot(3), roundDate: "2026-11-02" }]);

    expect(calendar).toHaveLength(14);
    expect(calendar[0].state).toBe("complete");
    expect(calendar[1].slots[2]?.id).toBe("Q3");
    expect(calendar[1].state).toBe("incomplete");
    expect(missingDays(calendar)).toEqual([
      "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07",
    ]);
  });
});
