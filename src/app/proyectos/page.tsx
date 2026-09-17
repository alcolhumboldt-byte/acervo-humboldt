import Link from "next/link";
import type { Metadata } from "next";
import { AvisoNombres } from "@/components/aviso-nombres";
import { ProjectCard } from "@/components/project-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  gradeLabel,
  getFilterOptions,
  searchPublishedProjects,
} from "@/modules/discovery/projects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Proyectos" };

type Params = Record<string, string | string[] | undefined>;

function texto(params: Params, clave: string): string | undefined {
  const valor = params[clave];
  if (typeof valor !== "string") return undefined;
  const limpio = valor.trim();
  return limpio === "" ? undefined : limpio;
}

function numero(params: Params, clave: string): number | undefined {
  const valor = texto(params, clave);
  if (valor === undefined) return undefined;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : undefined;
}

/** Arma el enlace a otra página conservando los filtros activos. */
function enlacePagina(params: Params, pagina: number): string {
  const query = new URLSearchParams();

  for (const clave of ["q", "area", "grado", "anio"]) {
    const valor = texto(params, clave);
    if (valor !== undefined) query.set(clave, valor);
  }

  query.set("pagina", String(pagina));
  return `/proyectos?${query.toString()}`;
}

export default async function Proyectos({
  searchParams,
}: PageProps<"/proyectos">) {
  const params = await searchParams;

  const filtros = {
    query: texto(params, "q"),
    area: texto(params, "area"),
    gradeLevel: numero(params, "grado"),
    year: numero(params, "anio"),
    page: numero(params, "pagina") ?? 1,
  };

  const [resultado, opciones] = await Promise.all([
    searchPublishedProjects(filtros),
    getFilterOptions(),
  ]);

  const hayFiltros =
    filtros.query !== undefined ||
    filtros.area !== undefined ||
    filtros.gradeLevel !== undefined ||
    filtros.year !== undefined;

  const campo =
    "rounded-md border border-gris bg-blanco px-3 py-2 text-sm text-tinta";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 pt-12 pb-20">
          <h1 className="font-titulo text-3xl text-tinta">Proyectos</h1>

          {/* Formulario GET: los filtros quedan en la dirección, así que una
              búsqueda se puede compartir o guardar, y funciona sin JavaScript. */}
          <form
            method="get"
            className="mt-8 rounded-lg border border-gris bg-blanco p-5"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label htmlFor="q" className="mb-2 block text-sm font-bold">
                  Buscar
                </label>
                <input
                  id="q"
                  name="q"
                  type="search"
                  defaultValue={filtros.query ?? ""}
                  placeholder="Palabras del título o del resumen"
                  className={`${campo} w-full`}
                />
              </div>

              <div>
                <label htmlFor="area" className="mb-2 block text-sm font-bold">
                  Área
                </label>
                <select
                  id="area"
                  name="area"
                  defaultValue={filtros.area ?? ""}
                  className={`${campo} w-full`}
                >
                  <option value="">Todas</option>
                  {opciones.areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="grado" className="mb-2 block text-sm font-bold">
                  Grado
                </label>
                <select
                  id="grado"
                  name="grado"
                  defaultValue={filtros.gradeLevel ?? ""}
                  className={`${campo} w-full`}
                >
                  <option value="">Todos</option>
                  {opciones.grades.map((grado) => (
                    <option key={grado} value={grado}>
                      {gradeLabel(grado)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="anio" className="mb-2 block text-sm font-bold">
                  Año
                </label>
                <select
                  id="anio"
                  name="anio"
                  defaultValue={filtros.year ?? ""}
                  className={`${campo} w-full`}
                >
                  <option value="">Todos</option>
                  {opciones.years.map((anio) => (
                    <option key={anio} value={anio}>
                      {anio}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-4">
                <button
                  type="submit"
                  className="rounded-md bg-morado px-5 py-2 text-sm font-bold text-blanco transition-colors hover:bg-morado-hondo"
                >
                  Filtrar
                </button>

                {hayFiltros ? (
                  <Link href="/proyectos" className="text-sm text-morado-hondo underline">
                    Quitar filtros
                  </Link>
                ) : null}
              </div>
            </div>
          </form>

          <p className="mt-8 text-sm text-gris-texto" role="status">
            {resultado.total === 0
              ? "Ningún proyecto coincide con esa búsqueda."
              : `${resultado.total} ${
                  resultado.total === 1
                    ? "proyecto encontrado"
                    : "proyectos encontrados"
                }`}
          </p>

          {resultado.projects.length > 0 ? (
            <ul className="mt-5 grid gap-5 sm:grid-cols-2">
              {resultado.projects.map((proyecto) => (
                <li key={proyecto.slug}>
                  <ProjectCard proyecto={proyecto} />
                </li>
              ))}
            </ul>
          ) : null}

          {resultado.pageCount > 1 ? (
            <nav
              aria-label="Paginación"
              className="mt-10 flex items-center justify-between gap-4 text-sm"
            >
              {resultado.page > 1 ? (
                <Link
                  href={enlacePagina(params, resultado.page - 1)}
                  className="text-morado-hondo underline"
                >
                  Página anterior
                </Link>
              ) : (
                <span />
              )}

              <span className="text-gris-texto">
                Página {resultado.page} de {resultado.pageCount}
              </span>

              {resultado.page < resultado.pageCount ? (
                <Link
                  href={enlacePagina(params, resultado.page + 1)}
                  className="text-morado-hondo underline"
                >
                  Página siguiente
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}

          <div className="mt-12">
            <AvisoNombres />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
