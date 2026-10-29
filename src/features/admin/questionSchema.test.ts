import { describe, expect, it } from "vitest";
import { fieldErrors, leakedPlaceWords, readQuestionForm } from "./questionSchema";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const values = {
    prompt: "Dicen que late cuando salta la hinchada",
    placeName: "La Bombonera, Buenos Aires",
    lat: "-34.6355",
    lng: "-58.3647",
    countryCode: "ar",
    sport: "",
    difficulty: "2",
    hint1: "Cono Sur",
    hint2: "Barrio portuario",
    hint3: "Azul y oro",
    story: "",
    sourceUrl: "",
    ...overrides,
  };
  for (const [k, v] of Object.entries(values)) data.set(k, v);
  return data;
}

describe("readQuestionForm", () => {
  it("normaliza país, deporte por defecto y fuente vacía", () => {
    const result = readQuestionForm(form());
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      countryCode: "AR",
      sport: "fútbol",
      lat: -34.6355,
      difficulty: 2,
      hints: ["Cono Sur", "Barrio portuario", "Azul y oro"],
      sourceUrl: null,
    });
  });

  it("marca la pista vacía y las coordenadas fuera de rango", () => {
    const result = readQuestionForm(form({ hint2: "  ", lat: "95", sourceUrl: "no es url" }));
    expect(result.success).toBe(false);
    const errors = fieldErrors(result.error!);
    expect(Object.keys(errors).sort()).toEqual(["hint2", "lat", "sourceUrl"]);
    expect(errors.hint2).toBe("La pista 2 es obligatorio");
  });

  it("rechaza un país que no es código de 2 letras", () => {
    const result = readQuestionForm(form({ countryCode: "ARG" }));
    expect(result.success).toBe(false);
  });
});

describe("leakedPlaceWords", () => {
  it("detecta el nombre en el acertijo sin importar acentos ni mayúsculas", () => {
    expect(leakedPlaceWords("Estádio do Maracanã, Rio", ["Acá juega el MARACANA"])).toEqual(["maracana"]);
  });

  it("ignora palabras genéricas y lo que va después de la coma", () => {
    expect(leakedPlaceWords("Estadio Centenario, Montevideo", ["Un estadio en Montevideo"])).toEqual([]);
  });

  it("no cuenta palabras parciales", () => {
    expect(leakedPlaceWords("El Campín", ["campinas"])).toEqual([]);
  });
});
