import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // 303: el navegador sigue con GET. Con 307 repetiría el POST contra "/".
  return NextResponse.redirect(new URL("/", siteUrl(request)), 303);
}
