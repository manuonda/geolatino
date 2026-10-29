import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Admin = { userId: string; email: string };

/** Lista de emails de ADMIN_EMAILS, separados por coma, en minúscula. */
export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined, raw = process.env.ADMIN_EMAILS): boolean {
  if (!email) return false;
  return parseAdminEmails(raw).includes(email.trim().toLowerCase());
}

/** El admin con sesión, o null si no hay sesión o el email no está en ADMIN_EMAILS. */
export async function getAdmin(): Promise<Admin | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email : null;
  if (!claims?.sub || !isAdminEmail(email)) return null;
  return { userId: claims.sub, email: email! };
}

/**
 * Corta con 404 si quien pide no es admin. Llamarla en el layout de /admin
 * y también al principio de cada Server Action: una action se puede invocar sin pasar por el layout.
 */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) notFound();
  return admin;
}
