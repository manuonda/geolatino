import type { NextRequest } from "next/server";

/** Cookie que recuerda a dónde volver después del login con Google. */
export const NEXT_PATH_COOKIE = "gl-next";

/** URL pública del sitio. Detrás de un proxy inverso el origen del pedido puede ser localhost. */
export function siteUrl(request: NextRequest): string {
  return process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
}

/** Solo rutas internas: empieza con "/" y no con "//" ni "/\". */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
