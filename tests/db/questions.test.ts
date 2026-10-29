import { execFileSync } from "node:child_process";
import { beforeEach, describe, expect, it } from "vitest";
import { findRoundQuestion, getPublicRound } from "@/lib/questions";
import { insertQuestion } from "./fixtures";
import { createPlayer, resetData, sql } from "./sql";

beforeEach(() => resetData());

describe("tabla questions", () => {
  it("genera ids EST- desde 1000", () => {
    sql(`insert into questions (prompt, place_name, lat, lng, country_code, difficulty, hints)
         values ('a', 'b', 0, 0, 'AR', 1, array['1','2','3'])`);
    expect(sql("select id from questions")).toBe("EST-1000");
  });

  it("exige exactamente 3 pistas", () => {
    expect(() =>
      sql(`insert into questions (prompt, place_name, lat, lng, country_code, difficulty, hints)
           values ('a', 'b', 0, 0, 'AR', 1, array['1','2'])`),
    ).toThrow(/check constraint/);
  });

  it("no acepta fecha sin lugar", () => {
    expect(() =>
      sql(`insert into questions (round_date, prompt, place_name, lat, lng, country_code, difficulty, hints)
           values ('2026-11-01', 'a', 'b', 0, 0, 'AR', 1, array['1','2','3'])`),
    ).toThrow(/check constraint/);
  });

  it("no acepta dos preguntas en el mismo lugar del mismo día", () => {
    insertQuestion({ id: "A", date: "2026-11-01", position: 1 });
    expect(() => insertQuestion({ id: "B", date: "2026-11-01", position: 1 })).toThrow(/duplicate key/);
  });

  it("una jugada tiene que apuntar a una pregunta existente", () => {
    createPlayer("00000000-0000-0000-0000-000000000001", "Ana");
    expect(() =>
      sql(`insert into plays (player_id, round_date, question_id, guess_lat, guess_lng, distance_km, hints_used, raw_score, score)
           values ('00000000-0000-0000-0000-000000000001', '2026-11-01', 'NO-EXISTE', 0, 0, 1, 0, 50, 50)`),
    ).toThrow(/foreign key/);
  });
});

describe("getPublicRound", () => {
  it("devuelve solo las aprobadas del día, ordenadas por lugar y sin la respuesta", async () => {
    insertQuestion({ id: "Q3", date: "2026-11-01", position: 3 });
    insertQuestion({ id: "Q1", date: "2026-11-01", position: 1 });
    insertQuestion({ id: "Q2", date: "2026-11-01", position: 2, status: "ai_reviewed" });
    insertQuestion({ id: "OTRO", date: "2026-11-02", position: 1 });

    const round = await getPublicRound("2026-11-01");

    expect(round?.map((q) => q.id)).toEqual(["Q1", "Q3"]);
    expect(round?.[0]).toEqual({
      id: "Q1",
      orden: 1,
      pregunta: "Acertijo Q1",
      deporte: "fútbol",
      dificultad: 2,
      pistas: ["p1", "p2", "p3"],
    });
  });

  it("devuelve una lista vacía si el día no tiene preguntas", async () => {
    expect(await getPublicRound("2026-12-25")).toEqual([]);
  });
});

describe("findRoundQuestion", () => {
  it("encuentra la pregunta de ayer con la respuesta", async () => {
    insertQuestion({ id: "Q1", date: "2026-10-31", position: 4, lat: -22.9, lng: -43.2 });

    const found = await findRoundQuestion("Q1", ["2026-11-01", "2026-10-31"]);

    expect(found?.date).toBe("2026-10-31");
    expect(found?.question).toMatchObject({ orden: 4, lat: -22.9, lng: -43.2, lugar: "Lugar Q1" });
  });

  it("no acepta una pregunta de otro día", async () => {
    insertQuestion({ id: "Q1", date: "2026-10-20", position: 1 });
    expect(await findRoundQuestion("Q1", ["2026-11-01", "2026-10-31"])).toBeNull();
  });

  it("no acepta una pregunta sin aprobar", async () => {
    insertQuestion({ id: "Q1", date: "2026-11-01", position: 1, status: "ai_reviewed" });
    expect(await findRoundQuestion("Q1", ["2026-11-01"])).toBeNull();
  });
});

describe("scripts/seed-questions.mjs", () => {
  it("carga las 5 preguntas del JSON en la fecha pedida y es idempotente", () => {
    const run = () =>
      execFileSync("node", ["scripts/seed-questions.mjs", "--fecha=2026-11-05"], {
        env: process.env,
        encoding: "utf8",
      });
    expect(run()).toContain("Cargadas 5 preguntas");
    run();

    expect(sql("select count(*) from questions where round_date = '2026-11-05' and status = 'approved'")).toBe("5");
    expect(sql("select source_url from questions where id = 'EST-0001'")).toBe(
      "https://www.wikidata.org/wiki/Q499855",
    );
  });
});
