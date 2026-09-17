import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { buildSearchText } from "../src/modules/discovery/search-text";

/**
 * Datos de ejemplo para desarrollo.
 *
 * Los estudiantes son inventados. Sirven para ver la interfaz con contenido
 * real en lugar de maquetas, y para comprobar que el filtro por estado
 * funciona: hay un proyecto en borrador que no debe aparecer en el portal.
 */

if (process.env.NODE_ENV === "production") {
  throw new Error(
    "Los datos de ejemplo no pueden cargarse en producción.",
  );
}

const EJEMPLOS = [
  {
    slug: "humedales-de-sogamoso",
    title: "Estado de los humedales urbanos de Sogamoso",
    summary:
      "Muestreo de calidad del agua en tres humedales del casco urbano durante un año lectivo, con propuesta de indicadores de seguimiento para la comunidad.",
    area: "Ciencias naturales",
    gradeLevel: 10,
    year: 2026,
    status: "PUBLISHED" as const,
    authors: [
      { givenNames: "María Fernanda", familyNames: "Rodríguez Gómez" },
      { givenNames: "Juan Sebastián", familyNames: "Castro Peña" },
    ],
  },
  {
    slug: "memoria-oral-del-barrio",
    title: "Memoria oral de nuestro barrio",
    summary:
      "Recopilación de veinte entrevistas a personas mayores del barrio, convertidas en una línea de tiempo ilustrada sobre los cambios del territorio.",
    area: "Ciencias sociales",
    gradeLevel: 8,
    year: 2026,
    status: "PUBLISHED" as const,
    authors: [{ givenNames: "Laura Sofía", familyNames: "Quesada Ríos" }],
  },
  {
    slug: "geometria-en-la-arquitectura",
    title: "Geometría escondida en la arquitectura del centro",
    summary:
      "Registro fotográfico y análisis de figuras geométricas en fachadas del centro histórico, con modelos construidos a escala.",
    area: "Matemáticas",
    gradeLevel: 6,
    year: 2025,
    status: "PUBLISHED" as const,
    authors: [
      { givenNames: "Camilo", familyNames: "Álvarez Mora" },
      { givenNames: "Ana Lucía", familyNames: "Del Valle Sánchez" },
    ],
  },
  {
    slug: "huerta-escolar",
    title: "La huerta escolar como aula viva",
    summary:
      "Bitácora de dos ciclos de siembra en la huerta del colegio, con registro de germinación y una guía práctica para los cursos siguientes.",
    area: "Ciencias naturales",
    gradeLevel: 3,
    year: 2025,
    status: "PUBLISHED" as const,
    authors: [{ givenNames: "Valentina", familyNames: "Torres" }],
  },
  {
    slug: "cuentos-de-la-laguna",
    title: "Cuentos de la laguna",
    summary:
      "Antología de relatos breves escritos por el curso a partir de leyendas locales, ilustrada por los mismos autores.",
    area: "Lengua castellana",
    gradeLevel: 5,
    year: 2024,
    status: "PUBLISHED" as const,
    authors: [{ givenNames: "Santiago", familyNames: "de la Cruz Pardo" }],
  },
  {
    slug: "robot-clasificador",
    title: "Robot clasificador de residuos",
    summary:
      "Prototipo que separa residuos por material usando sensores, todavía en construcción.",
    area: "Tecnología e informática",
    gradeLevel: 11,
    year: 2026,
    status: "DRAFT" as const,
    authors: [{ givenNames: "Diego Alejandro", familyNames: "Nieto Vargas" }],
  },
];

async function main(): Promise<void> {
  for (const ejemplo of EJEMPLOS) {
    const { authors, status, ...datos } = ejemplo;

    const publishedAt =
      status === "PUBLISHED" ? new Date(datos.year, 10, 1) : null;
    const searchText = buildSearchText(datos);

    await prisma.project.upsert({
      where: { slug: ejemplo.slug },
      // Al reejecutar se refrescan los datos del proyecto, pero no los
      // autores: volver a crearlos los duplicaría.
      update: { ...datos, status, publishedAt, searchText },
      create: {
        ...datos,
        status,
        publishedAt,
        searchText,
        authors: { create: authors },
      },
    });
  }

  const publicados = await prisma.project.count({
    where: { status: "PUBLISHED" },
  });

  console.log(
    `Datos de ejemplo listos: ${EJEMPLOS.length} proyectos, ${publicados} publicados.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
