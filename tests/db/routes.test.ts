import { beforeEach, describe, expect, it, vi } from "vitest";
import { todayInBuenosAires } from "@/lib/timezone";
import { insertQuestion } from "./fixtures";
import { createPlayer, resetData, sql } from "./sql";

// La sesión sale de las cookies del pedido; en el test se simula.
const session = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("@/lib/supabase/server", () => ({
  getSessionUserId: async () => session.userId,
}));

const { GET: getRonda } = await import("@/app/api/ronda/route");
const { POST: postJugada } = await import("@/app/api/jugada/route");

const PLAYER = "00000000-0000-0000-0000-0000000000aa";
const today = todayInBuenosAires();

function jugada(body: unknown) {
  return postJugada(
    new Request("http://test/api/jugada", { method: "POST", body: JSON.stringify(body) }),
  );
}

beforeEach(() => {
  resetData();
  session.userId = null;
  insertQuestion({ id: "HOY-1", date: today, position: 1, lat: -34.6355, lng: -58.3647 });
});

describe("GET /api/ronda", () => {
  it("devuelve la ronda de hoy sin coordenadas", async () => {
    const body = await (await getRonda()).json();
    expect(body.date).toBe(today);
    expect(body.questions).toHaveLength(1);
    expect(body.questions[0]).not.toHaveProperty("lat");
  });
});

describe("POST /api/jugada", () => {
  it("puntúa una jugada anónima sin guardarla", async () => {
    const res = await jugada({ questionId: "HOY-1", guess: { lat: -34.6355, lng: -58.3647 }, hintsUsed: 0 });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.rawScore).toBe(100);
    expect(body.persisted).toBe(false);
    expect(sql("select count(*) from plays")).toBe("0");
  });

  it("con sesión guarda solo el primer intento", async () => {
    createPlayer(PLAYER, "Ana");
    session.userId = PLAYER;

    const first = await (await jugada({ questionId: "HOY-1", guess: { lat: -34.6355, lng: -58.3647 } })).json();
    const second = await (await jugada({ questionId: "HOY-1", guess: { lat: 10, lng: 10 } })).json();

    expect(first.persisted).toBe(true);
    expect(second.persisted).toBe(true);
    expect(second.score).toBe(first.score);
    expect(sql("select count(*) from plays")).toBe("1");
  });

  it("responde 404 para una pregunta que no es de hoy ni de ayer", async () => {
    insertQuestion({ id: "VIEJA", date: "2026-10-01", position: 1 });
    const res = await jugada({ questionId: "VIEJA", guess: { lat: 0, lng: 0 } });
    expect(res.status).toBe(404);
  });

  it("responde 400 con coordenadas inválidas", async () => {
    const res = await jugada({ questionId: "HOY-1", guess: { lat: 95, lng: 0 } });
    expect(res.status).toBe(400);
  });
});
