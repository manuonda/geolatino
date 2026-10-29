// Entorno local para probar la app sin un proyecto de Supabase: Postgres + PostgREST en Docker
// y un proxy que imita la URL de Supabase con un login de prueba.
//
//   node scripts/local-stack.mjs          # deja todo corriendo hasta Ctrl+C
//
// Después, en otra terminal:
//
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54341 SUPABASE_SECRET_KEY=local \
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local ADMIN_EMAILS=admin@example.com pnpm dev
//
// El script imprime una cookie de sesión del usuario admin@example.com para pegar en el navegador.
// Es solo para desarrollo: el "login" acepta cualquier token y no tiene nada que ver con producción.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";

const PG = { name: "geolatino-local-pg", port: 54339 };
const REST = { name: "geolatino-local-rest", port: 54340 };
const PROXY_PORT = 54341;
const USER = {
  id: "00000000-0000-0000-0000-00000000a0a0",
  email: process.env.LOCAL_EMAIL ?? "admin@example.com",
  name: "Admin Local",
};

const docker = (...args) =>
  execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const sql = (text) =>
  execFileSync("docker", ["exec", "-i", PG.name, "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-qAt"], {
    input: text,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stop() {
  for (const name of [REST.name, PG.name]) {
    try {
      docker("rm", "-f", name);
    } catch {
      // no existía
    }
  }
}

async function retry(fn, what) {
  for (let i = 0; i < 60; i++) {
    try {
      if (await fn()) return;
    } catch {
      // todavía no
    }
    await sleep(500);
  }
  throw new Error(`Timeout esperando ${what}`);
}

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());

stop();
docker("run", "-d", "--name", PG.name, "-e", "POSTGRES_PASSWORD=postgres", "-p", `${PG.port}:5432`, "postgres:16-alpine");
await retry(() => sql("select 1") === "1", "Postgres");

sql("create schema auth; create table auth.users (id uuid primary key, email text);");
const dir = path.resolve("supabase/migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
// 0004 (clave foránea) va después del seed, como en Supabase.
for (const file of files.filter((f) => !f.startsWith("0004"))) sql(readFileSync(path.join(dir, file), "utf8"));

// Seed: las 5 preguntas del JSON para hoy, más dos borradores para probar la bandeja.
const questions = JSON.parse(readFileSync("src/data/questions.json", "utf8"));
const q = (v) => (v === null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
for (const x of questions) {
  sql(`insert into questions (id, round_date, position, prompt, place_name, lat, lng, country_code, sport, difficulty, hints, story, source_url, status)
       values (${q(x.id)}, ${q(today)}, ${x.orden}, ${q(x.pregunta)}, ${q(x.lugar)}, ${x.lat}, ${x.lng}, ${q(x.pais)}, ${q(x.deporte)}, ${x.dificultad},
               array[${x.pistas.map(q).join(",")}], ${q(x.historia)}, ${q(x.fuente)}, 'approved')`);
}
sql(`insert into questions (prompt, place_name, lat, lng, country_code, difficulty, hints, status) values
  ('Acá el Monumental de Núñez es local', 'Estadio Monumental, Buenos Aires', -34.5453, -58.4498, 'AR', 2, array['Río de la Plata','Banda roja','Final de 1978'], 'draft'),
  ('Templo del fútbol chileno', 'Estadio Nacional, Santiago', -33.4645, -70.6107, 'CL', 3, array['Cordillera','1962','Ñuñoa'], 'ai_reviewed')`);
sql(readFileSync(path.join(dir, files.find((f) => f.startsWith("0004"))), "utf8"));
sql(`insert into auth.users (id, email) values ('${USER.id}', '${USER.email}');
     insert into players (id, display_name) values ('${USER.id}', 'Admin');`);

docker(
  "run", "-d", "--name", REST.name, "--network", "host",
  "-e", `PGRST_DB_URI=postgres://postgres:postgres@127.0.0.1:${PG.port}/postgres`,
  "-e", "PGRST_DB_ANON_ROLE=postgres",
  "-e", "PGRST_DB_SCHEMAS=public",
  "-e", `PGRST_SERVER_PORT=${REST.port}`,
  "postgrest/postgrest:v12.2.3",
);
await retry(async () => (await fetch(`http://127.0.0.1:${REST.port}/`)).ok, "PostgREST");

const authUser = {
  id: USER.id,
  aud: "authenticated",
  role: "authenticated",
  email: USER.email,
  user_metadata: { full_name: USER.name },
  app_metadata: { provider: "google" },
};

const proxy = http.createServer((req, res) => {
  const url = req.url ?? "/";
  if (url.startsWith("/auth/v1/user")) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(authUser));
    return;
  }
  if (!url.startsWith("/rest/v1")) {
    res.writeHead(404);
    res.end();
    return;
  }
  const headers = { ...req.headers };
  delete headers.authorization;
  delete headers.host;
  const upstream = http.request(
    { host: "127.0.0.1", port: REST.port, path: url.replace(/^\/rest\/v1/, "") || "/", method: req.method, headers },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on("error", (e) => {
    res.writeHead(502);
    res.end(String(e));
  });
  req.pipe(upstream);
});
proxy.listen(PROXY_PORT, "127.0.0.1");

// Sesión con un JWT HS256 sin firma válida: getClaims() lo confirma contra /auth/v1/user de este proxy.
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
const accessToken = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
  sub: USER.id,
  email: USER.email,
  role: "authenticated",
  aud: "authenticated",
  exp,
  iat: exp - 7 * 24 * 3600,
  session_id: "local",
})}.firma-local`;
const session = {
  access_token: accessToken,
  refresh_token: "local",
  token_type: "bearer",
  expires_in: 7 * 24 * 3600,
  expires_at: exp,
  user: authUser,
};
const cookie = `sb-127-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;

console.log(`
Entorno local listo (ronda de hoy: ${today}).

Arrancá la app en otra terminal:

  NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:${PROXY_PORT} SUPABASE_SECRET_KEY=local \\
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local ADMIN_EMAILS=${USER.email} pnpm dev

Para entrar como ${USER.email}, en la consola del navegador en http://localhost:3000:

  document.cookie = "${cookie}; path=/"

Ctrl+C para apagar y borrar los contenedores.
`);

const shutdown = () => {
  proxy.close();
  stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
