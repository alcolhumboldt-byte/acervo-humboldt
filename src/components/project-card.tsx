import Link from "next/link";
import { gradeLabel, type PublicProject } from "@/modules/discovery/projects";

export function ProjectCard({ proyecto }: { proyecto: PublicProject }) {
  return (
    <Link
      href={`/proyectos/${proyecto.slug}`}
      className="block h-full rounded-lg border border-gris border-l-4 border-l-morado bg-blanco p-6 transition-colors hover:border-l-morado-hondo hover:bg-papel"
    >
      <p className="text-sm text-gris-texto">
        {proyecto.area} · {gradeLabel(proyecto.gradeLevel)} · {proyecto.year}
      </p>

      <h3 className="mt-2 font-titulo text-xl leading-snug text-tinta">
        {proyecto.title}
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-gris-texto">
        {proyecto.summary}
      </p>

      <p className="mt-4 text-sm text-azul">{proyecto.authors.join(", ")}</p>
    </Link>
  );
}
