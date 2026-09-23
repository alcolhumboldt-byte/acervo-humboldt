/**
 * Nombres de los grados.
 *
 * Vive aparte de las consultas a la base de datos a propósito: esto lo usa
 * también el navegador, y cualquier archivo que toque la base arrastra
 * consigo el controlador de PostgreSQL al paquete del cliente.
 */

const GRADE_NAMES = [
  "Preescolar",
  "Primero",
  "Segundo",
  "Tercero",
  "Cuarto",
  "Quinto",
  "Sexto",
  "Séptimo",
  "Octavo",
  "Noveno",
  "Décimo",
  "Once",
];

export function gradeLabel(level: number): string {
  return GRADE_NAMES[level] ?? "Sin grado";
}
