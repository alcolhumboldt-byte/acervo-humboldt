import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente de base de datos, creado en la primera consulta y no al importar
 * este archivo.
 *
 * La diferencia importa al compilar: Next importa cada página para leer su
 * configuración, sin ejecutar ninguna consulta. Si la conexión se construyera
 * aquí arriba, compilar exigiría tener la base de datos configurada, y la
 * compilación fallaría en un servidor que no la necesita todavía.
 */

function crearCliente(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Falta la variable de entorno DATABASE_URL.");
  }

  /**
   * Reserva de conexiones pensada para un servidor sin estado: en producción
   * la aplicación corre en muchas instancias que aparecen y desaparecen, cada
   * una con su propia reserva, y PostgreSQL solo admite un número limitado de
   * conexiones. Tres bastan para que las consultas paralelas de una misma
   * página no hagan cola.
   */
  const adapter = new PrismaPg({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
  });

  return new PrismaClient({ adapter });
}

// En desarrollo Next recarga los módulos en cada cambio. Sin esta caché global
// se abriría una conexión nueva por recarga hasta agotar la reserva.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function obtenerCliente(): PrismaClient {
  globalForPrisma.prisma ??= crearCliente();
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_destino, propiedad) {
    const cliente = obtenerCliente() as unknown as Record<
      string | symbol,
      unknown
    >;
    const valor = cliente[propiedad];

    return typeof valor === "function" ? valor.bind(cliente) : valor;
  },
});
