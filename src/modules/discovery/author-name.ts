/**
 * Cómo se nombra públicamente a un estudiante.
 *
 * Por defecto el portal muestra el primer nombre y la inicial del primer
 * apellido. El nombre completo solo aparece si un administrador registró que
 * la familia firmó la autorización correspondiente (Ley 1581 de 2012).
 *
 * Todos los autores son menores de edad: esta función es la única puerta por
 * la que sus nombres salen al público.
 */

export interface AuthorNameInput {
  givenNames: string;
  familyNames: string;
  fullNameAuthorized: boolean;
}

/**
 * Partículas que acompañan a los apellidos españoles. No sirven como inicial:
 * la de «de la Cruz» es la C.
 */
const PARTICLES = new Set([
  "de",
  "del",
  "la",
  "las",
  "los",
  "van",
  "von",
  "da",
  "di",
  "y",
]);

function tokens(value: string): string[] {
  return value.split(/\s+/).filter(Boolean);
}

export function displayAuthorName({
  givenNames,
  familyNames,
  fullNameAuthorized,
}: AuthorNameInput): string {
  const nombres = tokens(givenNames);
  const apellidos = tokens(familyNames);

  if (fullNameAuthorized) {
    return [...nombres, ...apellidos].join(" ");
  }

  const primerNombre = nombres[0] ?? "";

  // Se busca el primer apellido que no sea una partícula. Si todo lo
  // registrado son partículas, se usa la primera antes que quedarse sin nada.
  const apellido =
    apellidos.find((parte) => !PARTICLES.has(parte.toLowerCase())) ??
    apellidos[0];

  if (!apellido) {
    return primerNombre;
  }

  return `${primerNombre} ${apellido[0]?.toUpperCase()}.`;
}
