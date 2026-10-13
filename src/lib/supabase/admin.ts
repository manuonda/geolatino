import { createClient } from "@supabase/supabase-js";

/** Cliente con la secret key: saltea RLS. Solo servidor, nunca desde "use client". */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
