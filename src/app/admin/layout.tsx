import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin · GeoLatino",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin/preguntas", label: "Preguntas" },
  { href: "/admin/preguntas/nueva", label: "Nueva" },
  { href: "/admin/calendario", label: "Calendario" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-stretch border-b-[3px] border-night bg-gold text-night">
        <Link href="/admin/preguntas" className="flex items-center px-4 py-2 font-hud text-sm font-extrabold">
          GeoLatino · Admin
        </Link>
        <nav className="flex flex-1 flex-wrap">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center border-l-[3px] border-night px-3 py-2 font-hud text-xs font-bold tracking-wider hover:bg-night hover:text-gold"
            >
              {item.label.toUpperCase()}
            </Link>
          ))}
        </nav>
        <span className="flex items-center px-4 py-2 font-hud text-xs">{admin.email}</span>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
