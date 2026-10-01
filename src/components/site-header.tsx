import Link from "next/link";
import { LogoAcervo } from "@/components/logo";
import { INSTITUCION } from "@/config/institucion";

export function SiteHeader() {
  return (
    <header className="border-b border-gris bg-blanco">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-4 px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-morado-hondo"
        >
          <LogoAcervo className="h-9 w-9 shrink-0" />
          <span className="font-titulo text-xl leading-none">Acervo</span>
        </Link>
        <span className="text-sm text-gris-texto">{INSTITUCION.nombre}</span>
      </div>
    </header>
  );
}
