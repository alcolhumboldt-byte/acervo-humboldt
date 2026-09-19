import Link from "next/link";
import { AvisoNombres } from "@/components/aviso-nombres";
import { ProjectCard } from "@/components/project-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { INSTITUCION } from "@/config/institucion";
import { getArchiveStats, listPublishedProjects } from "@/modules/discovery/projects";

/**
 * La portada se arma en cada visita.
 *
 * Prerenderizarla congelaría la lista de proyectos en el momento de compilar:
 * publicar uno nuevo no se vería hasta el siguiente despliegue. Además
 * obligaría a tener la base de datos disponible durante el build, que es algo
 * que la integración continua no tiene.
 */
export const dynamic = "force-dynamic";

function Cifra({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-4">
      <dt className="text-sm text-gris-texto">{etiqueta}</dt>
      <dd className="font-titulo text-2xl tabular-nums text-morado-hondo">
        {valor}
      </dd>
    </div>
  );
}

export default async function Home() {
  const [proyectos, cifras] = await Promise.all([
    listPublishedProjects({ limit: 5 }),
    getArchiveStats(),
  ]);

  const [destacado, ...resto] = proyectos;

  const periodo =
    cifras.firstYear === null || cifras.lastYear === null
      ? null
      : cifras.firstYear === cifras.lastYear
        ? String(cifras.lastYear)
        : `${cifras.firstYear}–${cifras.lastYear}`;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              {/* Las capas aluden al concepto del archivo: cada año añade una. */}
              <div aria-hidden="true" className="mb-10 flex flex-col gap-1.5">
                <span className="block h-[3px] w-28 bg-morado-claro" />
                <span className="block h-[3px] w-20 bg-morado" />
                <span className="block h-[3px] w-12 bg-morado-hondo" />
              </div>

              <h1 className="font-titulo text-4xl leading-[1.05] tracking-tight text-tinta sm:text-5xl">
                La memoria académica de nuestros estudiantes
              </h1>

              <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-gris-texto">
                Acervo reúne los proyectos y reconocimientos destacados del{" "}
                {INSTITUCION.nombre}, de preescolar a grado once. Cada año
                lectivo añade una capa a este archivo.
              </p>

              <Link
                href="/proyectos"
                className="mt-9 inline-block rounded-pieza bg-morado px-6 py-3 font-bold text-blanco shadow-capa transition-[background-color,transform] duration-200 hover:bg-morado-hondo active:scale-[0.98]"
              >
                Explorar el archivo
              </Link>
            </div>

            {/* Cifras reales de la base. Sin tarjeta: las separa una línea. */}
            <div className="lg:col-span-4 lg:col-start-9">
              {cifras.projectCount === 0 ? (
                <p className="border-t border-gris pt-5 text-sm leading-relaxed text-gris-texto">
                  El archivo todavía no tiene publicaciones.
                </p>
              ) : (
                <dl className="divide-y divide-gris border-t border-gris">
                  <Cifra
                    etiqueta="Proyectos publicados"
                    valor={String(cifras.projectCount)}
                  />
                  <Cifra
                    etiqueta="Áreas académicas"
                    valor={String(cifras.areaCount)}
                  />
                  {periodo ? <Cifra etiqueta="Años" valor={periodo} /> : null}
                </dl>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-gris pt-8">
            <h2 className="font-titulo text-2xl tracking-tight text-tinta">
              Publicaciones recientes
            </h2>

            {proyectos.length > 0 ? (
              <Link
                href="/proyectos"
                className="text-sm text-morado-hondo underline underline-offset-4"
              >
                Ver todos los proyectos
              </Link>
            ) : null}
          </div>

          {proyectos.length === 0 ? (
            <div className="mt-8 rounded-pieza border border-dashed border-gris px-8 py-14 text-center">
              <p className="font-titulo text-xl text-tinta">
                Aún no hay nada publicado
              </p>
              <p className="mx-auto mt-3 max-w-[48ch] leading-relaxed text-gris-texto">
                Cuando el colegio publique el primer proyecto, aparecerá aquí
                junto a su año, su área y sus autores.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {destacado ? (
                <div className="sm:col-span-2">
                  <ProjectCard proyecto={destacado} destacado indice={0} />
                </div>
              ) : null}

              {resto.map((proyecto, i) => (
                <ProjectCard
                  key={proyecto.slug}
                  proyecto={proyecto}
                  indice={i + 1}
                />
              ))}
            </div>
          )}

          <div className="mt-12">
            <AvisoNombres />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
