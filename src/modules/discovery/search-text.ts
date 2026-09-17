/**
 * Normalización del texto de búsqueda.
 *
 * En español la gente escribe sin tildes cuando busca. Guardar y consultar
 * sobre una versión sin tildes y en minúsculas hace que «geometria» encuentre
 * «Geometría», y «ninez» encuentre «niñez».
 */

export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Texto sobre el que busca el portal. La ñ se conserva como n por la misma
 *  razón que las tildes. */
export function buildSearchText(parts: {
  title: string;
  summary: string;
  area: string;
}): string {
  return normalizeForSearch(
    [parts.title, parts.summary, parts.area].join(" "),
  );
}
