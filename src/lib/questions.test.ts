import { describe, expect, it } from "vitest";
import { rowToQuestion, toPublicQuestion, type QuestionRow } from "./questions";

const row: QuestionRow = {
  id: "EST-0001",
  round_date: "2026-11-01",
  position: 2,
  prompt: "Acertijo",
  place_name: "La Bombonera",
  lat: -34.6,
  lng: -58.4,
  country_code: "AR",
  sport: "fútbol",
  difficulty: 3,
  hints: ["a", "b", "c"],
  story: "Historia",
  source_url: null,
};

describe("rowToQuestion", () => {
  it("convierte los nombres de columnas a los del juego", () => {
    expect(rowToQuestion(row)).toMatchObject({
      fecha: "2026-11-01",
      orden: 2,
      pregunta: "Acertijo",
      lugar: "La Bombonera",
      pais: "AR",
      historia: "Historia",
      fuente: "",
    });
  });
});

describe("toPublicQuestion", () => {
  it("no expone la respuesta", () => {
    const pub = toPublicQuestion(rowToQuestion(row));
    expect(pub).not.toHaveProperty("lat");
    expect(pub).not.toHaveProperty("lugar");
    expect(pub).not.toHaveProperty("historia");
  });
});
