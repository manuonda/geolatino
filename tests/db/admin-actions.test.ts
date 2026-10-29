import { beforeEach, describe, expect, it, vi } from "vitest";
import { insertQuestion } from "./fixtures";
import { resetData, sql } from "./sql";

// Sesión simulada: getClaims devuelve el email que fije cada test.
const session = vi.hoisted(() => ({ email: null as string | null }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({
        data: session.email ? { claims: { sub: "00000000-0000-0000-0000-0000000000ad", email: session.email } } : null,
      }),
    },
  }),
}));

const actions = await import("@/app/admin/preguntas/actions");

/** Next corta el flujo con errores especiales; acá se leen como resultado. */
async function outcome(run: () => Promise<unknown>): Promise<string> {
  try {
    const state = await run();
    return `state:${JSON.stringify(state)}`;
  } catch (error) {
    const digest = (error as { digest?: string }).digest ?? String(error);
    if (digest.startsWith("NEXT_REDIRECT")) return `redirect:${digest.split(";")[2]}`;
    if (digest.includes("404")) return "notFound";
    throw error;
  }
}

function questionForm(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const values: Record<string, string> = {
    prompt: "Acertijo", placeName: "Estadio X", lat: "-34", lng: "-58", countryCode: "AR",
    sport: "fútbol", difficulty: "2", hint1: "a", hint2: "b", hint3: "c", story: "", sourceUrl: "",
    ...overrides,
  };
  for (const [k, v] of Object.entries(values)) data.set(k, v);
  return data;
}

beforeEach(() => {
  resetData();
  session.email = "admin@example.com";
});

describe("acceso", () => {
  it("sin sesión o con un email que no es admin, responde 404 y no escribe", async () => {
    insertQuestion({ id: "D", status: "draft" });

    session.email = null;
    expect(await outcome(() => actions.createQuestionAction({}, questionForm()))).toBe("notFound");
    session.email = "intruso@example.com";
    expect(await outcome(() => actions.approveQuestionAction("D"))).toBe("notFound");

    expect(sql("select count(*) from questions")).toBe("1");
    expect(sql("select status from questions where id = 'D'")).toBe("draft");
  });
});

describe("como admin", () => {
  it("crea y redirige al detalle", async () => {
    const result = await outcome(() => actions.createQuestionAction({}, questionForm()));
    expect(result).toBe("redirect:/admin/preguntas/EST-1000?ok=creada");
    expect(sql("select status from questions")).toBe("draft");
  });

  it("devuelve errores por campo sin escribir", async () => {
    const result = await outcome(() => actions.createQuestionAction({}, questionForm({ hint3: "", lat: "x" })));
    expect(result).toContain('"hint3"');
    expect(result).toContain('"lat"');
    expect(sql("select count(*) from questions")).toBe("0");
  });

  it("aprueba con el email del admin y después asigna desde el calendario", async () => {
    insertQuestion({ id: "D", status: "draft" });
    expect(await outcome(() => actions.approveQuestionAction("D"))).toBe("redirect:/admin/preguntas/D?ok=aprobada");
    expect(sql("select reviewed_by from questions where id = 'D'")).toBe("admin@example.com");

    const form = new FormData();
    form.set("id", "D");
    form.set("date", "2099-01-01");
    form.set("position", "2");
    form.set("returnTo", "/admin/calendario");
    expect(await outcome(() => actions.assignQuestionAction({}, form))).toBe("redirect:/admin/calendario");
    expect(sql("select round_date || ' ' || position from questions where id = 'D'")).toBe("2099-01-01 2");
  });

  it("no redirige fuera de /admin", async () => {
    insertQuestion({ id: "A" });
    const form = new FormData();
    form.set("id", "A");
    form.set("date", "2099-01-02");
    form.set("position", "1");
    form.set("returnTo", "https://evil.example");
    expect(await outcome(() => actions.assignQuestionAction({}, form))).toBe("redirect:/admin/preguntas/A?ok=asignada");
  });

  it("rechazar sin motivo devuelve el error", async () => {
    insertQuestion({ id: "R", status: "draft" });
    const form = new FormData();
    form.set("reason", "");
    expect(await outcome(() => actions.rejectQuestionAction("R", {}, form))).toBe(
      'state:{"message":"Escribí el motivo del rechazo"}',
    );
  });
});
