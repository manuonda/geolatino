import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { NEXT_PATH_COOKIE, safeNextPath, siteUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const site = siteUrl(request);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: new URL("/auth/callback", site).toString() },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/?error=login", site));
  }

  const cookieStore = await cookies();
  cookieStore.set(NEXT_PATH_COOKIE, safeNextPath(request.nextUrl.searchParams.get("next")), {
    httpOnly: true,
    sameSite: "lax",
    secure: site.startsWith("https://"),
    path: "/auth",
    maxAge: 600,
  });

  return NextResponse.redirect(data.url);
}
