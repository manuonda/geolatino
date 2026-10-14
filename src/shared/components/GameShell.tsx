import type { ReactNode } from "react";

type GameShellProps = {
  children: ReactNode;
  className?: string;
};

/** Columna de juego centrada. En pantallas anchas los costados quedan para publicidad, fuera del globo. */
export function GameShell({ children, className = "" }: GameShellProps) {
  return (
    <div className="pixel-grid flex min-h-dvh w-full justify-center gap-6 xl:px-6">
      <AdRail />
      <main className={`relative w-full min-w-0 max-w-[880px] bg-night ${className}`}>
        {children}
      </main>
      <AdRail />
    </div>
  );
}

function AdRail() {
  return (
    <aside
      aria-label="Publicidad"
      className="sticky top-0 hidden h-dvh w-40 shrink-0 items-center xl:flex"
    >
      <div className="flex h-[600px] w-40 items-center justify-center border-2 border-dashed border-cream/15 font-hud text-[10px] tracking-[0.3em] text-cream/30">
        PUBLICIDAD
      </div>
    </aside>
  );
}
