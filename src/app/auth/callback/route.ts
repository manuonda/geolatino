import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { NEXT_PATH_COOKIE, safeNextPath, siteUrl } from "@/lib/auth-redirect";
import { upsertPlayer } from "@/lib/players";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const site = siteUrl(request);
  const failed = NextResponse.redirect(new URL("/?error=login", site));

  const cookieStore = await cookies();
  const next = safeNextPath(cookieStore.get(NEXT_PATH_COOKIE)?.value);
  cookieStore.delete({ name: NEXT_PATH_COOKIE, path: "/auth" });

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return failed;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return failed;

  // Sin fila en players, cada insert en plays fallaría por clave foránea.
  if (!(await upsertPlayer(data.user))) {
    await supabase.auth.signOut();
    return failed;
  }

  return NextResponse.redirect(new URL(next, site));
}
