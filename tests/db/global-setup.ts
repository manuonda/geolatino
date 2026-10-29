import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import {
  PG_CONTAINER,
  PG_PORT,
  PROXY_PORT,
  REST_CONTAINER,
  REST_PORT,
} from "./env";
import { sql } from "./sql";

const docker = (...args: string[]) =>
  execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function removeContainers() {
  for (const name of [REST_CONTAINER, PG_CONTAINER]) {
    try {
      docker("rm", "-f", name);
    } catch {
      // no existía
    }
  }
}

async function waitFor(check: () => boolean | Promise<boolean>, what: string) {
  for (let i = 0; i < 60; i++) {
    try {
      if (await check()) return;
    } catch {
      // todavía no
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timeout esperando ${what}`);
}

// Lo mínimo de Supabase que usan las migraciones: el esquema auth con su tabla users.
const SUPABASE_STUB = `
create schema auth;
create table auth.users (id uuid primary key, email text);
`;

export default async function setup() {
  removeContainers();

  docker(
    "run", "-d", "--name", PG_CONTAINER,
    "-e", "POSTGRES_PASSWORD=postgres",
    "-p", `${PG_PORT}:5432`,
    "postgres:16-alpine",
  );
  await waitFor(() => {
    docker("exec", PG_CONTAINER, "pg_isready", "-U", "postgres");
    sql("select 1");
    return true;
  }, "Postgres");

  const dir = path.resolve("supabase/migrations");
  const migrations = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  sql(SUPABASE_STUB);
  for (const file of migrations) {
    try {
      sql(readFileSync(path.join(dir, file), "utf8"));
    } catch (error) {
      throw new Error(`Falló la migración ${file}: ${(error as Error).message}`);
    }
  }

  // El rol anónimo de PostgREST es el superusuario: se comporta como la secret key, que saltea RLS.
  docker(
    "run", "-d", "--name", REST_CONTAINER, "--network", "host",
    "-e", `PGRST_DB_URI=postgres://postgres:postgres@127.0.0.1:${PG_PORT}/postgres`,
    "-e", "PGRST_DB_ANON_ROLE=postgres",
    "-e", "PGRST_DB_SCHEMAS=public",
    "-e", `PGRST_SERVER_PORT=${REST_PORT}`,
    "postgrest/postgrest:v12.2.3",
  );
  await waitFor(async () => (await fetch(`http://127.0.0.1:${REST_PORT}/`)).ok, "PostgREST");

  // Supabase sirve PostgREST en /rest/v1. El proxy quita ese prefijo y el header
  // Authorization, porque la clave de test no es un JWT.
  const proxy = http.createServer((req, res) => {
    const target = (req.url ?? "/").replace(/^\/rest\/v1/, "") || "/";
    const headers = { ...req.headers };
    delete headers.authorization;
    delete headers.host;
    const upstream = http.request(
      { host: "127.0.0.1", port: REST_PORT, path: target, method: req.method, headers },
      (up) => {
        res.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(res);
      },
    );
    upstream.on("error", (error) => {
      res.writeHead(502);
      res.end(String(error));
    });
    req.pipe(upstream);
  });
  await new Promise<void>((resolve) => proxy.listen(PROXY_PORT, "127.0.0.1", resolve));

  return async () => {
    await new Promise((resolve) => proxy.close(resolve));
    removeContainers();
  };
}
