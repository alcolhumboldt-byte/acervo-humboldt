import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Falta la variable de entorno DATABASE_URL.");
}

/**
 * Reserva de conexiones pensada para un servidor sin estado.
 *
 * En producción la aplicación no corre en un proceso único y permanente, sino
 * en muchas instancias que aparecen y desaparecen. Cada una abre su propia
 * reserva, y PostgreSQL solo admite un número limitado de conexiones a la vez.
 * Un tope bajo evita agotarlas; tres bastan para que las consultas paralelas
 * de una misma página no tengan que hacer cola.
 */
const adapter = new PrismaPg({
  connectionString,
  max: 3,
  idleTimeoutMillis: 10_000,
});

// En desarrollo Next recarga los módulos en cada cambio. Sin esta caché
// global se abriría una conexión nueva por recarga hasta agotar la reserva.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
