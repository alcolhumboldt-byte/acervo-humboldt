import { afterAll, afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";

const EMAIL_PRUEBA = "prueba.conexion@example.test";

async function limpiar() {
  await prisma.user.deleteMany({ where: { email: EMAIL_PRUEBA } });
}

afterEach(limpiar);
afterAll(async () => {
  await prisma.$disconnect();
});

describe("conexión a la base de datos", () => {
  it("guarda y recupera un usuario", async () => {
    const creado = await prisma.user.create({
      data: {
        email: EMAIL_PRUEBA,
        name: "Usuario de prueba",
        passwordHash: "hash-ficticio",
      },
    });

    const leido = await prisma.user.findUnique({ where: { email: EMAIL_PRUEBA } });

    expect(leido?.id).toBe(creado.id);
    expect(leido?.name).toBe("Usuario de prueba");
  });

  it("aplica los valores por defecto del esquema", async () => {
    const usuario = await prisma.user.create({
      data: {
        email: EMAIL_PRUEBA,
        name: "Usuario de prueba",
        passwordHash: "hash-ficticio",
      },
    });

    expect(usuario.role).toBe("DOCENTE");
    expect(usuario.isActive).toBe(true);
    expect(usuario.failedLoginAttempts).toBe(0);
    expect(usuario.lockedUntil).toBeNull();
  });

  it("rechaza dos usuarios con el mismo correo", async () => {
    const datos = {
      email: EMAIL_PRUEBA,
      name: "Usuario de prueba",
      passwordHash: "hash-ficticio",
    };

    await prisma.user.create({ data: datos });

    await expect(prisma.user.create({ data: datos })).rejects.toThrow();
  });
});
