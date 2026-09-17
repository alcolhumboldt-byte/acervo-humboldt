import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acervo",
  description:
    "Repositorio de proyectos académicos y reconocimientos de estudiantes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
