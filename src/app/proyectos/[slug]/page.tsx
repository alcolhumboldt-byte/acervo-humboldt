import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AvisoNombres } from "@/components/aviso-nombres";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { gradeLabel, getPublishedProject } from "@/modules/discovery/projects";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/proyectos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const proyecto = await getPublishedProject(slug);

  return { title: proyecto?.title ?? "Proyecto no encontrado" };
}

export default async function ProyectoDetalle({
  params,
}: PageProps<"/proyectos/[slug]">) {
  const { slug } = await params;
  const proyecto = await getPublishedProject(slug);

  // Un proyecto sin publicar responde igual que uno inexistente: si diera un
  // error distinto, se podría averiguar qué borradores existen probando slugs.
  if (!proyecto) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 pt-12 pb-16">
          <Link href="/" className="text-sm text-morado-hondo underline underline-offset-4">
            Volver al inicio
          </Link>

          <p className="mt-8 text-sm text-gris-texto">
            {proyecto.area} · {gradeLabel(proyecto.gradeLevel)} · {proyecto.year}
          </p>

          <h1 className="mt-2 font-titulo text-4xl leading-[1.08] tracking-tight text-tinta">
            {proyecto.title}
          </h1>

          <p className="mt-4 text-azul">{proyecto.authors.join(", ")}</p>

          <div className="mt-8 border-t border-gris pt-8">
            <p className="text-lg leading-relaxed text-tinta">
              {proyecto.summary}
            </p>
          </div>

          <div className="mt-14 border-t border-gris pt-8">
            <h2 className="font-titulo text-lg tracking-tight text-tinta">
              Documento del proyecto
            </h2>
            <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-gris-texto">
              La consulta del documento completo se solicita al colegio y
              requiere aprobación. Esa función todavía no está disponible.
            </p>
          </div>

          <div className="mt-10">
            <AvisoNombres />
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
