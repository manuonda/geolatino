import type { Metadata } from "next";
import { DM_Sans, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GeoLatino",
  description: "Tocá en el mapa dónde pasó · 5 preguntas de deporte latinoamericano",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-theme="deporte"
      className={`${dmSans.variable} ${pixelify.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-night text-cream font-sans">
        {children}
      </body>
    </html>
  );
}
