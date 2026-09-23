import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { PanelHeader } from "@/components/panel-header";
import { StatusBadge } from "@/components/status-badge";
import {
  allowedTransitions,
  getProjectForPanel,
} from "@/modules/catalog/projects";
import { actualizarProyecto } from "../actions";
import { ProjectForm } from "../project-form";
import { StatusActions } from "../status-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Editar proyecto" };

export default async function EditarProyecto({
  params,
}: PageProps<"/panel/proyectos/[id]">) {
  const sesion = await auth();

  if (!sesion?.user?.role) {
    redirect("/ingresar");
  }

  const { id } = await params;
  const proyecto = await getProjectForPanel(id);

  if (!proyecto) {
    notFound();
  }

  const permitidos = allowedTransitions(proyecto.status, sesion.user.role);

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

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <h1 className="font-titulo text-3xl leading-tight tracking-tight text-tinta">
            {proyecto.title}
          </h1>
          <StatusBadge status={proyecto.status} />
        </div>

        {proyecto.status === "PUBLISHED" ? (
          <p className="mt-3 text-sm text-gris-texto">
            Visible en el portal:{" "}
            <Link
              href={`/proyectos/${proyecto.slug}`}
              className="text-morado-hondo underline underline-offset-4"
            >
              /proyectos/{proyecto.slug}
            </Link>
          </p>
        ) : null}

        <section className="mt-8 border-t border-gris pt-8">
          <h2 className="font-titulo text-xl tracking-tight text-tinta">
            Estado de publicación
          </h2>
          <p className="mt-2 mb-5 max-w-[60ch] text-sm leading-relaxed text-gris-texto">
            Un proyecto pasa por borrador y revisión antes de publicarse. Solo
            un administrador puede publicarlo o archivarlo.
          </p>

          <StatusActions id={proyecto.id} permitidos={permitidos} />
        </section>

        <section className="mt-12 border-t border-gris pt-8">
          <h2 className="font-titulo text-xl tracking-tight text-tinta">
            Datos del proyecto
          </h2>

          <ProjectForm
            accion={actualizarProyecto.bind(null, proyecto.id)}
            inicial={proyecto}
            textoBoton="Guardar cambios"
          />
        </section>
      </main>
    </div>
  );
}
