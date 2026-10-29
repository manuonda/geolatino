"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatRoundDate, roundNumber, todayInBuenosAires } from "@/lib/timezone";

type MenuItem = {
  label: string;
  href?: string;
  badge?: "activo" | "pronto";
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const SECTIONS: MenuSection[] = [
  {
    title: "Jugar",
    items: [
      { label: "Ronda de hoy", href: "/jugar" },
      { label: "Resultados de hoy", href: "/resultados" },
    ],
  },
  {
    title: "Competir",
    items: [
      { label: "Ranking de hoy", href: "/ranking" },
      { label: "Mis estadísticas", href: "/perfil" },
      { label: "Grupos con amigos", badge: "pronto" },
    ],
  },
  {
    title: "Mundos",
    items: [
      { label: "Deporte", badge: "activo" },
      { label: "Historia", badge: "pronto" },
      { label: "Cultura", badge: "pronto" },
    ],
  },
  {
    title: "Acerca",
    items: [
      { label: "Inicio", href: "/" },
      { label: "Cómo se puntúa", href: "/puntaje" },
      { label: "Mandá una pregunta", badge: "pronto" },
    ],
  },
];

/** Barra superior del juego: menú, número de ronda y fecha. */
export function GameTopBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const date = todayInBuenosAires();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative z-40 w-full">
      <div className="relative z-50 flex h-10 items-stretch border-[3px] border-night bg-gold text-night block-shadow">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="game-menu"
          className="flex items-center gap-2 border-r-[3px] border-night px-3 font-hud text-xs font-bold tracking-widest transition-colors hover:bg-night hover:text-gold"
        >
          <span aria-hidden="true" className="flex flex-col gap-[3px]">
            <span className="block h-[3px] w-4 bg-current" />
            <span className="block h-[3px] w-4 bg-current" />
            <span className="block h-[3px] w-4 bg-current" />
          </span>
          MENÚ
        </button>
        <Link
          href="/"
          className="flex flex-1 items-center justify-center font-hud text-sm font-extrabold tracking-wide"
        >
          GeoLatino #{roundNumber(date)}
        </Link>
        <span className="flex items-center px-3 font-hud text-xs font-bold tabular-nums">
          {formatRoundDate(date)}
        </span>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 cursor-default bg-night/60"
            onClick={() => setOpen(false)}
          />
          <nav
            id="game-menu"
            className="absolute left-0 top-12 z-50 max-h-[calc(100dvh-5rem)] w-72 overflow-y-auto border-[3px] border-gold bg-night block-shadow"
          >
            <p className="border-b-[3px] border-gold/40 bg-pitch px-4 py-2 font-hud text-xs font-bold tracking-[0.25em] text-gold">
              PAUSA · ELEGÍ UNA OPCIÓN
            </p>
            {SECTIONS.map((section) => (
              <div
                key={section.title}
                className="border-b-[3px] border-gold/15 py-2 last:border-b-0"
              >
                <p className="px-4 py-1 font-hud text-[10px] font-bold tracking-[0.3em] text-gold/60">
                  {section.title.toUpperCase()}
                </p>
                <ul>
                  {section.items.map((item) => (
                    <li key={item.label}>
                      <MenuRow
                        item={item}
                        active={item.href === pathname}
                        onSelect={() => setOpen(false)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}

function MenuRow({
  item,
  active,
  onSelect,
}: {
  item: MenuItem;
  active: boolean;
  onSelect: () => void;
}) {
  const base =
    "group flex w-full items-center gap-2 px-4 py-2 font-hud text-sm font-semibold outline-none";
  const content = (
    <>
      <span
        aria-hidden="true"
        className={`w-3 ${active ? "" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}
      >
        ▶
      </span>
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span
          className={`border-[2px] px-1.5 text-[10px] font-bold uppercase tracking-wider ${
            item.badge === "activo"
              ? "border-night bg-chip-green text-cream"
              : "border-cream/25 text-cream/50"
          }`}
        >
          {item.badge}
        </span>
      )}
    </>
  );

  if (!item.href) {
    const disabled = item.badge !== "activo";
    return (
      <div
        aria-disabled={disabled}
        className={`${base} ${disabled ? "cursor-not-allowed text-cream/45" : "text-cream"}`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={`${base} ${
        active
          ? "bg-gold/15 text-gold"
          : "text-cream hover:bg-gold hover:text-night focus-visible:bg-gold focus-visible:text-night"
      }`}
    >
      {content}
    </Link>
  );
}
