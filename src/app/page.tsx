import Link from "next/link";
import { AvisoNombres } from "@/components/aviso-nombres";
import { ProjectCard } from "@/components/project-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { INSTITUCION } from "@/config/institucion";
import { listPublishedProjects } from "@/modules/discovery/projects";

/**
 * La portada se arma en cada visita.
 *
 * Prerenderizarla congelaría la lista de proyectos en el momento de compilar:
 * publicar uno nuevo no se vería hasta el siguiente despliegue. Además
 * obligaría a tener la base de datos disponible durante el build, que es algo
 * que la integración continua no tiene.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const proyectos = await listPublishedProjects({ limit: 6 });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 pt-16 pb-12">
          {/* Las tres capas aluden al concepto del archivo: cada año añade una. */}
          <div aria-hidden="true" className="mb-8 flex flex-col gap-1">
            <span className="block h-1 w-24 bg-morado-claro" />
            <span className="block h-1 w-16 bg-morado" />
            <span className="block h-1 w-10 bg-morado-hondo" />
          </div>

          <h1 className="max-w-2xl font-titulo text-4xl leading-tight text-tinta sm:text-5xl">
            La memoria académica de nuestros estudiantes
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gris-texto">
            Acervo reúne los proyectos y reconocimientos destacados del{" "}
            {INSTITUCION.nombre}, de preescolar a grado once. Cada año lectivo
            añade una capa a este archivo.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20">
          <h2 className="font-titulo text-2xl text-tinta">
            Publicaciones recientes
          </h2>

          {proyectos.length === 0 ? (
            <p className="mt-6 rounded-lg border border-gris bg-blanco px-6 py-8 text-gris-texto">
              Todavía no hay proyectos publicados. Cuando el colegio publique el
              primero, aparecerá aquí.
            </p>
          ) : (
            <ul className="mt-6 grid gap-5 sm:grid-cols-2">
              {proyectos.map((proyecto) => (
                <li key={proyecto.slug}>
                  <ProjectCard proyecto={proyecto} />
                </li>
              ))}
            </ul>
          )}

          <p className="mt-8">
            <Link
              href="/proyectos"
              className="font-bold text-morado-hondo underline"
            >
              Ver todos los proyectos
            </Link>
          </p>

          <div className="mt-8">
            <AvisoNombres />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
