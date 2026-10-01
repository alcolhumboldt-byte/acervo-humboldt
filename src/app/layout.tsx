import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Source_Serif_4 } from "next/font/google";
import { INSTITUCION } from "@/config/institucion";
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

const DESCRIPCION =
  `Proyectos académicos y reconocimientos destacados de los estudiantes del ${INSTITUCION.nombre}, de preescolar a grado once.`;

export const metadata: Metadata = {
  // Necesaria para que las direcciones de las tarjetas al compartir salgan
  // completas y no relativas.
  metadataBase: new URL("https://acervo-humboldt.vercel.app"),

  title: { default: `Acervo · ${INSTITUCION.nombre}`, template: "%s · Acervo" },
  description: DESCRIPCION,
  applicationName: "Acervo",

  // Lo que se ve cuando alguien pega el enlace en WhatsApp o en un correo.
  openGraph: {
    type: "website",
    siteName: "Acervo",
    locale: "es_CO",
    title: `Acervo · ${INSTITUCION.nombre}`,
    description: DESCRIPCION,
  },

  /**
   * Mientras el archivo contenga proyectos de ejemplo con estudiantes
   * inventados, se pide a los buscadores que no lo indexen: aparecerían en
   * Google como trabajos reales del colegio.
   *
   * Quitar esta sección el día que el contenido sea auténtico.
   */
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${cuerpo.variable} ${titulo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
