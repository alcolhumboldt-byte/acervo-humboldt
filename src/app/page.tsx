import Link from "next/link";
import { INSTITUCION } from "@/config/institucion";
import { gradeLabel, listPublishedProjects } from "@/modules/discovery/projects";

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
    <div className="min-h-screen">
      <header className="border-b border-gris bg-blanco">
        <div className="mx-auto flex max-w-5xl items-baseline justify-between px-6 py-5">
          <span className="font-titulo text-xl text-morado-hondo">Acervo</span>
          <span className="text-sm text-gris-texto">{INSTITUCION.nombre}</span>
        </div>
      </header>

      <main>
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
                <li
                  key={proyecto.slug}
                  className="rounded-lg border border-gris border-l-4 border-l-morado bg-blanco p-6"
                >
                  <p className="text-sm text-gris-texto">
                    {proyecto.area} · {gradeLabel(proyecto.gradeLevel)} ·{" "}
                    {proyecto.year}
                  </p>

                  <h3 className="mt-2 font-titulo text-xl leading-snug text-tinta">
                    {proyecto.title}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-gris-texto">
                    {proyecto.summary}
                  </p>

                  <p className="mt-4 text-sm text-azul">
                    {proyecto.authors.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-gris-texto">
            Los autores son estudiantes menores de edad. Por eso sus nombres se
            muestran reducidos, y el nombre completo solo aparece cuando la
            familia ha firmado la autorización correspondiente.
          </p>
        </section>
      </main>

      <footer className="border-t border-gris bg-blanco">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-gris-texto">
          <span>
            {INSTITUCION.nombre} · {INSTITUCION.ciudad}
          </span>
          <Link href="/ingresar" className="text-morado-hondo underline">
            Ingreso del personal
          </Link>
        </div>
      </footer>
    </div>
  );
}
