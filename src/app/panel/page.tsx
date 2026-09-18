import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { INSTITUCION } from "@/config/institucion";
import { salir } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Panel" };

const NOMBRE_ROL: Record<string, string> = {
  ADMIN: "Administrador",
  DOCENTE: "Docente",
};

export default async function Panel() {
  const sesion = await auth();

  // El middleware ya bloquea esta ruta. La comprobación se repite aquí porque
  // una página que muestra datos internos no debe depender de una sola
  // barrera: si algún día cambia el filtro de rutas, esto sigue cerrado.
  if (!sesion?.user) {
    redirect("/ingresar");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gris bg-blanco">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <span className="font-titulo text-xl text-morado-hondo">
              Acervo
            </span>
            <span className="ml-3 text-sm text-gris-texto">Panel interno</span>
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-14 pb-24">
        <p className="text-sm text-gris-texto">
          {NOMBRE_ROL[sesion.user.role] ?? "Personal"} ·{" "}
          {INSTITUCION.nombre}
        </p>

        <h1 className="mt-2 font-titulo text-3xl tracking-tight text-tinta">
          Hola, {sesion.user.name}
        </h1>

        <div className="mt-10 border-t border-gris pt-8">
          <h2 className="font-titulo text-xl tracking-tight text-tinta">
            Todavía en construcción
          </h2>

          <p className="mt-3 max-w-[60ch] leading-relaxed text-gris-texto">
            Desde aquí se cargarán los proyectos y reconocimientos, se
            aprobarán las publicaciones y se atenderán las solicitudes de
            documentos. Nada de eso está construido aún.
          </p>

          <ul className="mt-6 max-w-[60ch] divide-y divide-gris border-t border-gris">
            {[
              "Crear y editar proyectos",
              "Cargar el documento PDF de cada proyecto",
              "Aprobar publicaciones antes de que salgan al portal",
              "Marcar la autorización firmada de cada familia",
              "Atender solicitudes de descarga",
            ].map((tarea) => (
              <li
                key={tarea}
                className="flex items-baseline gap-3 py-3 text-gris-texto"
              >
                <span aria-hidden="true" className="text-gris">
                  ·
                </span>
                {tarea}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
