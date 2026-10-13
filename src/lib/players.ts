import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUserId } from "@/lib/supabase/server";

const FALLBACK_NAME = "Jugador";
const MAX_NAME_LENGTH = 24;

export type Player = {
  id: string;
  displayName: string;
};

/** El ranking es público: se guarda el primer nombre, no el nombre completo de Google. */
function publicName(user: User): string {
  const metadata = user.user_metadata ?? {};
  const full = String(metadata.full_name ?? metadata.name ?? "").trim();
  const first = full.split(/\s+/)[0] ?? "";
  return first.slice(0, MAX_NAME_LENGTH) || FALLBACK_NAME;
}

/** Crea o actualiza la fila del jugador. Devuelve false si no se pudo guardar. */
export async function upsertPlayer(user: User): Promise<boolean> {
  const avatar = user.user_metadata?.avatar_url;
  const { error } = await createAdminClient()
    .from("players")
    .upsert({
      id: user.id,
      display_name: publicName(user),
      avatar_url: typeof avatar === "string" ? avatar : null,
    });

  if (error) {
    console.error("No se pudo guardar el jugador", error);
    return false;
  }
  return true;
}

/** Jugador con sesión iniciada, o null. */
export async function getCurrentPlayer(): Promise<Player | null> {
  const id = await getSessionUserId();
  if (!id) return null;

  const { data } = await createAdminClient()
    .from("players")
    .select("display_name")
    .eq("id", id)
    .maybeSingle();

  return { id, displayName: data?.display_name ?? FALLBACK_NAME };
}
