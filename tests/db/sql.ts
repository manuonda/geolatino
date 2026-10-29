import { execFileSync } from "node:child_process";
import { PG_CONTAINER } from "./env";

/** Ejecuta SQL en la base de test con psql. Lanza un error con el mensaje de Postgres si falla. */
export function sql(text: string): string {
  try {
    return execFileSync(
      "docker",
      ["exec", "-i", PG_CONTAINER, "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-qAt"],
      { input: text, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? "";
    throw new Error(stderr.trim() || String(error));
  }
}

/** Borra los datos de todas las tablas, en orden de dependencias. */
export function resetData() {
  sql("truncate plays, questions, players restart identity cascade; delete from auth.users;");
}

/** Crea un usuario de auth y su jugador. */
export function createPlayer(id: string, name: string, email = `${name.toLowerCase()}@example.com`) {
  sql(`insert into auth.users (id, email) values ('${id}', '${email}');
       insert into players (id, display_name) values ('${id}', '${name}');`);
}
