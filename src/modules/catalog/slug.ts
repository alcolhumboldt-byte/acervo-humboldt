/**
 * Dirección legible de un proyecto.
 *
 * Es lo que aparece en la barra del navegador y lo que la gente copia y
 * comparte, así que se construye a partir del título y no de un número.
 */

const RESPALDO = "proyecto";

export function slugify(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Busca una dirección libre a partir del título.
 *
 * Dos proyectos pueden llamarse igual —dos cursos distintos con la misma
 * huerta—, así que al segundo se le añade un número en lugar de rechazarlo.
 */
export async function uniqueSlug(
  titulo: string,
  estaOcupado: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(titulo) || RESPALDO;

  if (!(await estaOcupado(base))) {
    return base;
  }

  for (let sufijo = 2; sufijo < 1000; sufijo += 1) {
    const candidato = `${base}-${sufijo}`;

    if (!(await estaOcupado(candidato))) {
      return candidato;
    }
  }

  throw new Error(`No se encontró una dirección libre para «${titulo}».`);
}
