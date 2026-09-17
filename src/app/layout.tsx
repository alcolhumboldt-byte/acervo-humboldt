import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Atkinson Hyperlegible está diseñada para máxima legibilidad; Source Serif 4
// da el tono de archivo a los títulos.
const cuerpo = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--fuente-cuerpo",
});

const titulo = Source_Serif_4({
  subsets: ["latin"],
  variable: "--fuente-titulo",
});

export const metadata: Metadata = {
  title: "Acervo",
  description:
    "Repositorio de proyectos académicos y reconocimientos de estudiantes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${cuerpo.variable} ${titulo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
