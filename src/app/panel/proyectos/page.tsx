import Link from "next/link";
import type { Metadata } from "next";
import { PanelHeader } from "@/components/panel-header";
import { StatusBadge } from "@/components/status-badge";
import { listProjectsForPanel } from "@/modules/catalog/projects";
import { gradeLabel } from "@/modules/discovery/projects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Proyectos del panel" };

export default async function PanelProyectos() {
  const proyectos = await listProjectsForPanel();

  return (
    <div className="flex min-h-screen flex-col">
      <PanelHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-12 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-titulo text-3xl tracking-tight text-tinta">
            Proyectos
          </h1>

          <Link
            href="/panel/proyectos/nuevo"
            className="rounded-pieza bg-morado px-5 py-2.5 text-sm font-bold text-blanco transition-[background-color,transform] duration-200 hover:bg-morado-hondo active:scale-[0.98]"
          >
            Nuevo proyecto
          </Link>
        </div>

        {proyectos.length === 0 ? (
          <div className="mt-10 rounded-pieza border border-dashed border-gris px-8 py-14 text-center">
            <p className="font-titulo text-xl text-tinta">
              Todavía no hay proyectos
            </p>
            <p className="mx-auto mt-3 max-w-[48ch] leading-relaxed text-gris-texto">
              Crea el primero. Quedará en borrador hasta que un administrador lo
              publique.
            </p>
          </div>
        ) : (
          <ul className="mt-10 divide-y divide-gris border-t border-gris">
            {proyectos.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/panel/proyectos/${p.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 py-5 transition-colors hover:bg-blanco"
                >
                  <div className="min-w-0">
                    <p className="font-titulo text-lg leading-snug text-tinta">
                      {p.title}
                    </p>
                    <p className="mt-1 text-sm text-gris-texto">
                      {p.area} · {gradeLabel(p.gradeLevel)} · {p.year} ·{" "}
                      {p._count.authors}{" "}
                      {p._count.authors === 1 ? "autor" : "autores"}
                    </p>
                  </div>

                  <StatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
