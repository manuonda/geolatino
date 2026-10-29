// Carga src/data/questions.json en la tabla questions (upsert por id).
//
//   node --env-file=.env scripts/seed-questions.mjs
//   node --env-file=.env scripts/seed-questions.mjs --fecha=2026-11-01
//
// --fecha asigna las 5 preguntas a ese día, útil para probar /jugar en local.
// Sin --fecha quedan en la fecha del JSON (2026-10-05).
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY. Usá node --env-file=.env");
  process.exit(1);
}

const fechaArg = process.argv.find((arg) => arg.startsWith("--fecha="))?.slice("--fecha=".length);
if (fechaArg && !/^\d{4}-\d{2}-\d{2}$/.test(fechaArg)) {
  console.error("--fecha tiene que ser YYYY-MM-DD");
  process.exit(1);
}

const file = new URL("../src/data/questions.json", import.meta.url);
const questions = JSON.parse(await readFile(file, "utf8"));

const rows = questions.map((q) => ({
  id: q.id,
  round_date: fechaArg ?? q.fecha,
  position: q.orden,
  prompt: q.pregunta,
  place_name: q.lugar,
  lat: q.lat,
  lng: q.lng,
  country_code: q.pais,
  sport: q.deporte,
  difficulty: q.dificultad,
  hints: q.pistas,
  story: q.historia,
  source_url: q.fuente,
  status: q.verificada ? "approved" : "draft",
}));

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { error } = await supabase.from("questions").upsert(rows, { onConflict: "id" });

if (error) {
  console.error("No se pudo cargar el seed:", error.message);
  process.exit(1);
}
console.log(`Cargadas ${rows.length} preguntas${fechaArg ? ` para el ${fechaArg}` : ""}.`);
