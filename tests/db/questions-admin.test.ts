import { beforeEach, describe, expect, it } from "vitest";
import type { QuestionInput } from "@/features/admin/questionSchema";
import {
  approveQuestion,
  assignQuestion,
  createQuestion,
  getCalendar,
  getQuestion,
  listQuestions,
  rejectQuestion,
  updateQuestion,
} from "@/lib/questions-admin";
import { insertQuestion } from "./fixtures";
import { resetData, sql } from "./sql";

const TODAY = "2026-11-10";
const input: QuestionInput = {
  prompt: "Acertijo",
  placeName: "Estadio Centenario, Montevideo",
  lat: -34.89,
  lng: -56.15,
  countryCode: "UY",
  sport: "fútbol",
  difficulty: 3,
  hints: ["a", "b", "c"],
  story: "Historia",
  sourceUrl: null,
};

beforeEach(() => resetData());

describe("alta y edición", () => {
  it("crea la pregunta como borrador sin día", async () => {
    const created = await createQuestion(input);
    expect(created.ok).toBe(true);
    const q = await getQuestion(created.ok ? created.value : "");
    expect(q).toMatchObject({ status: "draft", roundDate: null, placeName: input.placeName, hints: ["a", "b", "c"] });
  });

  it("edita una pregunta futura", async () => {
    insertQuestion({ id: "F", date: "2026-11-20", position: 1 });
    expect((await updateQuestion("F", { ...input, lat: 1 }, TODAY)).ok).toBe(true);
    expect((await getQuestion("F"))?.lat).toBe(1);
  });

  it("en una pregunta ya jugada solo deja cambiar la historia", async () => {
    insertQuestion({ id: "P", date: TODAY, position: 1 });
    const current = (await getQuestion("P"))!;
    const same: QuestionInput = { ...current, story: "Historia corregida" };

    expect(await updateQuestion("P", { ...same, lat: 0 }, TODAY)).toEqual({
      ok: false,
      error: "Esta pregunta ya se jugó: solo se puede corregir la historia.",
    });
    expect((await updateQuestion("P", same, TODAY)).ok).toBe(true);
    expect((await getQuestion("P"))?.story).toBe("Historia corregida");
  });
});

describe("aprobar y rechazar", () => {
  it("aprueba guardando quién y cuándo", async () => {
    insertQuestion({ id: "D", status: "draft" });
    expect((await approveQuestion("D", "admin@example.com")).ok).toBe(true);
    const q = await getQuestion("D");
    expect(q).toMatchObject({ status: "approved", reviewedBy: "admin@example.com" });
    expect(q?.reviewedAt).not.toBeNull();
  });

  it("rechazar exige motivo y libera el día", async () => {
    insertQuestion({ id: "R", date: "2026-11-20", position: 2, status: "ai_reviewed" });
    expect((await rejectQuestion("R", "admin@example.com", " ", TODAY)).ok).toBe(false);
    expect((await rejectQuestion("R", "admin@example.com", "Coordenada mal", TODAY)).ok).toBe(true);
    expect(await getQuestion("R")).toMatchObject({ status: "rejected", roundDate: null, rejectReason: "Coordenada mal" });
  });

  it("no rechaza una pregunta ya jugada", async () => {
    insertQuestion({ id: "P", date: "2026-11-01", position: 1 });
    expect((await rejectQuestion("P", "a", "x", TODAY)).ok).toBe(false);
  });

  it("la base no acepta una rechazada con día", () => {
    insertQuestion({ id: "R", date: "2026-11-20", position: 1 });
    expect(() => sql("update questions set status = 'rejected' where id = 'R'")).toThrow(/questions_rejected_unassigned/);
  });
});

describe("asignar al calendario", () => {
  it("asigna una aprobada y avisa si el lugar está ocupado", async () => {
    insertQuestion({ id: "A" });
    insertQuestion({ id: "B" });
    expect((await assignQuestion("A", { date: "2026-11-12", position: 3 }, TODAY)).ok).toBe(true);
    expect(await assignQuestion("B", { date: "2026-11-12", position: 3 }, TODAY)).toEqual({
      ok: false,
      error: "El lugar 3 del 2026-11-12 ya está ocupado",
    });
  });

  it("no asigna borradores ni días pasados, y no mueve las ya jugadas", async () => {
    insertQuestion({ id: "D", status: "draft" });
    insertQuestion({ id: "A" });
    insertQuestion({ id: "P", date: "2026-11-01", position: 1 });

    expect((await assignQuestion("D", { date: "2026-11-12", position: 1 }, TODAY)).ok).toBe(false);
    expect((await assignQuestion("A", { date: "2026-11-09", position: 1 }, TODAY)).ok).toBe(false);
    expect((await assignQuestion("P", null, TODAY)).ok).toBe(false);
  });

  it("saca del calendario una pregunta futura", async () => {
    insertQuestion({ id: "F", date: "2026-11-20", position: 1 });
    expect((await assignQuestion("F", null, TODAY)).ok).toBe(true);
    expect((await getQuestion("F"))?.roundDate).toBeNull();
  });

  it("el calendario marca días completos e incompletos", async () => {
    for (const p of [1, 2, 3, 4, 5]) insertQuestion({ id: `C${p}`, date: TODAY, position: p });
    insertQuestion({ id: "X", date: "2026-11-11", position: 2, status: "ai_reviewed" });

    const calendar = await getCalendar(TODAY, 14);
    expect(calendar?.[0].state).toBe("complete");
    expect(calendar?.[1]).toMatchObject({ state: "incomplete" });
    expect(calendar?.[1].slots[1]?.id).toBe("X");
    expect(calendar?.[2].state).toBe("empty");
  });
});

describe("listQuestions", () => {
  it("filtra por estado, país, sin día y texto", async () => {
    insertQuestion({ id: "AR1", country: "AR" });
    insertQuestion({ id: "BR1", country: "BR", date: "2026-11-20", position: 1 });
    insertQuestion({ id: "BR2", country: "BR", status: "draft" });

    expect((await listQuestions({ country: "br" }))?.map((q) => q.id).sort()).toEqual(["BR1", "BR2"]);
    expect((await listQuestions({ status: "draft" }))?.map((q) => q.id)).toEqual(["BR2"]);
    expect((await listQuestions({ unassigned: true, status: "approved" }))?.map((q) => q.id)).toEqual(["AR1"]);
    expect((await listQuestions({ search: "Lugar BR1" }))?.map((q) => q.id)).toEqual(["BR1"]);
    expect((await listQuestions({ search: "a,b(c)" }))).toEqual([]);
  });
});
