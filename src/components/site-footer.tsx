import Link from "next/link";
import { INSTITUCION } from "@/config/institucion";

export function SiteFooter() {
  return (
    <footer className="border-t border-gris bg-blanco">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-gris-texto">
        <span>
          {INSTITUCION.nombre} · {INSTITUCION.ciudad}
        </span>
        <Link href="/ingresar" className="text-morado-hondo underline">
          Ingreso del personal
        </Link>
      </div>
    </footer>
  );
}
