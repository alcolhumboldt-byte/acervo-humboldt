import Link from "next/link";
import { gradeLabel, type PublicProject } from "@/modules/discovery/projects";

interface Props {
  proyecto: PublicProject;
  /** El primero de una lista ocupa más espacio y muestra el resumen completo. */
  destacado?: boolean;
  indice?: number;
}

export function ProjectCard({ proyecto, destacado = false, indice = 0 }: Props) {
  return (
    <Link
      href={`/proyectos/${proyecto.slug}`}
      style={{ "--indice": indice } as React.CSSProperties}
      className={[
        "aparece group relative flex h-full flex-col rounded-pieza bg-blanco",
        "shadow-capa transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:-translate-y-0.5 hover:shadow-capa-alta active:translate-y-0",
        destacado ? "p-8 sm:p-10" : "p-7",
      ].join(" ")}
    >
      {/* Borde interior de 1px: da el canto físico sin cargar una sombra dura. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-pieza ring-1 ring-gris ring-inset"
      />

      {/* La capa lateral crece al pasar el cursor: el archivo gana un estrato. */}
      <span
        aria-hidden="true"
        className="absolute top-7 bottom-7 left-0 w-[3px] rounded-full bg-morado transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:top-5 group-hover:bottom-5 group-hover:bg-morado-hondo"
      />

      <p className="text-sm text-gris-texto">
        {proyecto.area} · {gradeLabel(proyecto.gradeLevel)} · {proyecto.year}
      </p>

      <h3
        className={[
          "mt-3 font-titulo leading-tight tracking-tight text-tinta",
          destacado ? "text-2xl sm:text-3xl" : "text-xl",
        ].join(" ")}
      >
        {proyecto.title}
      </h3>

      <p
        className={[
          "mt-3 max-w-[60ch] leading-relaxed text-gris-texto",
          destacado ? "text-base" : "text-sm",
        ].join(" ")}
      >
        {proyecto.summary}
      </p>

      <p className="mt-6 text-sm text-azul">{proyecto.authors.join(", ")}</p>
    </Link>
  );
}
