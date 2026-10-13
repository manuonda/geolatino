import { getCurrentPlayer } from "@/lib/players";

type SessionStatusProps = {
  /** Ruta interna a la que se vuelve después de entrar. */
  next?: string;
};

const linkClass =
  "font-display text-base text-gold underline decoration-2 underline-offset-4";

export async function SessionStatus({ next = "/" }: SessionStatusProps) {
  const player = await getCurrentPlayer();

  if (!player) {
    // <a> y no <Link>: /auth/login es un route handler y no debe precargarse.
    return (
      <a href={`/auth/login?next=${encodeURIComponent(next)}`} className={linkClass}>
        Entrar con Google para competir
      </a>
    );
  }

  return (
    <form
      action="/auth/logout"
      method="post"
      className="flex items-center gap-3 font-sans text-base text-cream/90"
    >
      <span>Jugás como {player.displayName}</span>
      <button type="submit" className={`${linkClass} cursor-pointer`}>
        Salir
      </button>
    </form>
  );
}
