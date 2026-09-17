import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NoEncontrado() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 py-24">
        <h1 className="font-titulo text-3xl text-tinta">
          No encontramos esta página
        </h1>
        <p className="mt-4 leading-relaxed text-gris-texto">
          Puede que el enlace esté equivocado, o que el proyecto que buscas
          todavía no esté publicado.
        </p>
        <Link href="/" className="mt-8 text-morado-hondo underline">
          Volver al inicio
        </Link>
      </main>

      <SiteFooter />
    </div>
  );
}
