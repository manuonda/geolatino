import { z } from "zod";

const text = (label: string) => z.string().trim().min(1, { error: `${label} es obligatorio` });

export const questionInputSchema = z.object({
  prompt: text("El acertijo"),
  placeName: text("El nombre del lugar"),
  lat: z.coerce.number({ error: "Latitud inválida" }).min(-90).max(90),
  lng: z.coerce.number({ error: "Longitud inválida" }).min(-180).max(180),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, { error: "El país va como código de 2 letras (AR, BR...)" }),
  sport: text("El deporte"),
  difficulty: z.coerce.number().int().min(1).max(5),
  hints: z.tuple([text("La pista 1"), text("La pista 2"), text("La pista 3")]),
  story: z.string().trim(),
  sourceUrl: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.url({ error: "La fuente tiene que ser una URL" }).nullable()),
});

export type QuestionInput = z.infer<typeof questionInputSchema>;

/** Campos del formulario. Las pistas llegan como hint1, hint2 y hint3. */
export function readQuestionForm(formData: FormData) {
  const get = (name: string) => String(formData.get(name) ?? "");
  return questionInputSchema.safeParse({
    prompt: get("prompt"),
    placeName: get("placeName"),
    lat: get("lat"),
    lng: get("lng"),
    countryCode: get("countryCode"),
    sport: get("sport") || "fútbol",
    difficulty: get("difficulty"),
    hints: [get("hint1"), get("hint2"), get("hint3")],
    story: get("story"),
    sourceUrl: get("sourceUrl"),
  });
}

/** Errores por campo, con las pistas juntadas en "hints". */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] === "hints" ? `hint${Number(issue.path[1]) + 1}` : String(issue.path[0]);
    errors[key] ??= issue.message;
  }
  return errors;
}

// Palabras que no delatan el lugar aunque estén en el nombre.
const GENERIC = new Set([
  "estadio", "estádio", "arena", "cancha", "parque", "stadium", "municipal", "olimpico", "olimpica",
  "de", "del", "la", "el", "los", "las", "do", "da", "dos", "das",
]);

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Palabras del nombre del lugar (antes de la primera coma) que aparecen en el acertijo o las pistas.
 * Es un aviso, no un error: "Nacional" puede aparecer en una pista sin delatar nada.
 */
export function leakedPlaceWords(placeName: string, texts: string[]): string[] {
  const words = normalize(placeName.split(",")[0])
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !GENERIC.has(word));
  const haystack = texts.map(normalize).join(" ");
  return [...new Set(words.filter((word) => new RegExp(`\\b${word}\\b`).test(haystack)))];
}
