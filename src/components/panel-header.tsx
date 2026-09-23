import Link from "next/link";
import { salir } from "@/app/panel/actions";

export function PanelHeader() {
  return (
    <header className="border-b border-gris bg-blanco">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="flex flex-wrap items-baseline gap-5">
          <Link href="/panel" className="font-titulo text-xl text-morado-hondo">
            Acervo
          </Link>
          <Link
            href="/panel/proyectos"
            className="text-sm text-gris-texto underline underline-offset-4"
          >
            Proyectos
          </Link>
          <Link
            href="/"
            className="text-sm text-gris-texto underline underline-offset-4"
          >
            Ver el portal
          </Link>
        </div>

        <form action={salir}>
          <button
            type="submit"
            className="rounded-pieza px-4 py-2 text-sm font-bold text-morado-hondo underline underline-offset-4 transition-transform duration-200 active:scale-[0.98]"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </header>
  );
}
