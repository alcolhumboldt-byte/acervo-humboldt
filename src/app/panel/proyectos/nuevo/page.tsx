import Link from "next/link";
import type { Metadata } from "next";
import { PanelHeader } from "@/components/panel-header";
import { crearProyecto } from "../actions";
import { ProjectForm } from "../project-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nuevo proyecto" };

export default function NuevoProyecto() {
  return (
    <div className="flex min-h-screen flex-col">
      <PanelHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-12 pb-24">
        <Link
          href="/panel/proyectos"
          className="text-sm text-morado-hondo underline underline-offset-4"
        >
          Volver a proyectos
        </Link>

        <h1 className="mt-6 font-titulo text-3xl tracking-tight text-tinta">
          Nuevo proyecto
        </h1>
        <p className="mt-3 max-w-[60ch] leading-relaxed text-gris-texto">
          Queda guardado como borrador. No aparece en el portal público hasta
          que un administrador lo apruebe.
        </p>

        <ProjectForm accion={crearProyecto} textoBoton="Crear borrador" />
      </main>
    </div>
  );
}
