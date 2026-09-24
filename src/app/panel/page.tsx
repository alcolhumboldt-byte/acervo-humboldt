import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { PanelHeader } from "@/components/panel-header";
import { INSTITUCION } from "@/config/institucion";

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
      <PanelHeader />

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
            Proyectos
          </h2>
          <p className="mt-3 max-w-[60ch] leading-relaxed text-gris-texto">
            Desde ahí se hace todo el trabajo sobre un proyecto. El PDF y el
            estado de publicación se manejan dentro de cada uno, no desde esta
            página.
          </p>

          <ul className="mt-5 max-w-[60ch] divide-y divide-gris border-t border-gris">
            {[
              "Crear y editar proyectos, con sus autores",
              "Marcar la autorización firmada de cada familia",
              "Cargar o reemplazar el documento PDF",
              "Enviar a revisión, publicar y archivar",
            ].map((cosa) => (
              <li
                key={cosa}
                className="flex items-baseline gap-3 py-3 text-gris-texto"
              >
                <span aria-hidden="true" className="text-morado">
                  ·
                </span>
                {cosa}
              </li>
            ))}
          </ul>
          <Link
            href="/panel/proyectos"
            className="mt-6 inline-block rounded-pieza bg-morado px-6 py-3 font-bold text-blanco transition-[background-color,transform] duration-200 hover:bg-morado-hondo active:scale-[0.98]"
          >
            Ver proyectos
          </Link>
        </div>

        <div className="mt-12 border-t border-gris pt-8">
          <h2 className="font-titulo text-xl tracking-tight text-tinta">
            Todavía en construcción
          </h2>
          <ul className="mt-5 max-w-[60ch] divide-y divide-gris border-t border-gris">
            {[
              "Reconocimientos de estudiantes",
              "Atender solicitudes de descarga",
              "Cambiar la contraseña desde el panel",
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
