import Link from "next/link";
import { INSTITUCION } from "@/config/institucion";

export function SiteHeader() {
  return (
    <header className="border-b border-gris bg-blanco">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-4 px-6 py-5">
        <Link href="/" className="font-titulo text-xl text-morado-hondo">
          Acervo
        </Link>
        <span className="text-sm text-gris-texto">{INSTITUCION.nombre}</span>
      </div>
    </header>
  );
}
