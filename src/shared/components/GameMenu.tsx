"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  blockButtonClass,
  blockButtonVariants,
  Button,
} from "@/shared/components/Button";

type GameMenuProps = {
  compact?: boolean;
};

export function GameMenu({ compact = false }: GameMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button
        variant="ghost"
        className={compact ? "min-h-10 px-3 text-sm" : ""}
        onClick={() => setOpen(true)}
      >
        Menú
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4 pixel-grid">
          <div className="w-full max-w-sm border-[3px] border-gold bg-pitch p-5 block-shadow">
            <h2 className="mb-5 text-center font-display text-2xl text-gold">
              Juego pausado
            </h2>
            <nav className="flex flex-col gap-3">
              <Link
                href="/"
                className={`${blockButtonClass} ${blockButtonVariants.primary} w-full`}
                onClick={() => setOpen(false)}
              >
                Volver al inicio
              </Link>
              <Link
                href="/puntaje"
                className={`${blockButtonClass} ${blockButtonVariants.ghost} w-full`}
                onClick={() => setOpen(false)}
              >
                Cómo se puntúa
              </Link>
              <Link
                href="/resultados"
                className={`${blockButtonClass} ${blockButtonVariants.ghost} w-full`}
                onClick={() => setOpen(false)}
              >
                Resultados
              </Link>
              <p className="pt-2 font-display text-sm tracking-wider text-gold/80">
                MUNDOS
              </p>
              <Button className="w-full" disabled>
                Deporte · activo
              </Button>
              <Button className="w-full" variant="ghost" disabled>
                Historia · próximamente
              </Button>
              <Button className="w-full" variant="ghost" disabled>
                Cultura · próximamente
              </Button>
              <Button className="mt-2 w-full" variant="ghost" onClick={() => setOpen(false)}>
                Cerrar
              </Button>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
