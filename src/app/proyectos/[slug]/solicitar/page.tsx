import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublishedProject } from "@/modules/discovery/projects";
import { RequestForm } from "./request-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Solicitar documento" };

export default async function SolicitarDocumento({
  params,
}: PageProps<"/proyectos/[slug]/solicitar">) {
  const { slug } = await params;
  const proyecto = await getPublishedProject(slug);

  if (!proyecto) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-12 pb-24">
        <Link
          href={`/proyectos/${proyecto.slug}`}
          className="text-sm text-morado-hondo underline underline-offset-4"
        >
          Volver al proyecto
        </Link>

        <h1 className="mt-6 font-titulo text-3xl leading-tight tracking-tight text-tinta">
          Solicitar el documento completo
        </h1>

        <p className="mt-3 text-azul">{proyecto.title}</p>

        <p className="mt-6 max-w-[60ch] leading-relaxed text-gris-texto">
          El documento no se descarga directamente. El colegio revisa cada
          solicitud y, si la aprueba, envía un enlace personal que caduca y
          sirve una sola vez. Los trabajos son de estudiantes menores de edad y
          su difusión se decide caso por caso.
        </p>

        <RequestForm slug={proyecto.slug} />
      </main>

      <SiteFooter />
    </div>
  );
}
