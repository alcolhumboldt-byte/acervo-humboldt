import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  LOCK_DURATION_MINUTES,
  MAX_FAILED_ATTEMPTS,
  authenticate,
} from "@/modules/identity/authenticate";
import { hashPassword } from "@/modules/identity/password-hashing";

const EMAIL = "docente.prueba@acervo.test";
const PASSWORD = "Tiple-Bambuco-47!";
const OTRA = "Marimba-Chirimia-93!";

async function crearUsuario(
  extra: Parameters<typeof prisma.user.create>[0]["data"] extends infer D
    ? Partial<D>
    : never = {},
) {
  return prisma.user.create({
    data: {
      email: EMAIL,
      name: "Docente de prueba",
      passwordHash: await hashPassword(PASSWORD),
      ...extra,
    },
  });
}

async function limpiar() {
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({ where: { email: EMAIL } });
}

beforeEach(limpiar);
afterEach(limpiar);

describe("authenticate", () => {
  it("acepta las credenciales correctas", async () => {
    await crearUsuario();

    const resultado = await authenticate(EMAIL, PASSWORD);

    expect(resultado.ok).toBe(true);
  });

  it("no devuelve el hash de la contraseña", async () => {
    await crearUsuario();

    const resultado = await authenticate(EMAIL, PASSWORD);

    expect(JSON.stringify(resultado)).not.toContain("argon2");
  });

  it("ignora mayúsculas y espacios en el correo", async () => {
    await crearUsuario();

    const resultado = await authenticate(`  ${EMAIL.toUpperCase()} `, PASSWORD);

    expect(resultado.ok).toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    await crearUsuario();

    const resultado = await authenticate(EMAIL, OTRA);

    expect(resultado).toEqual({ ok: false, reason: "INVALID_CREDENTIALS" });
  });

  it("rechaza un correo desconocido sin lanzar error", async () => {
    const resultado = await authenticate("nadie@acervo.test", PASSWORD);

    expect(resultado).toEqual({ ok: false, reason: "INVALID_CREDENTIALS" });
  });

  it("cuenta los intentos fallidos", async () => {
    await crearUsuario();

    await authenticate(EMAIL, OTRA);
    await authenticate(EMAIL, OTRA);

    const usuario = await prisma.user.findUnique({ where: { email: EMAIL } });
    expect(usuario?.failedLoginAttempts).toBe(2);
  });

  it("bloquea la cuenta al alcanzar el máximo de intentos", async () => {
    await crearUsuario();

    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) {
      await authenticate(EMAIL, OTRA);
    }

    const usuario = await prisma.user.findUnique({ where: { email: EMAIL } });
    expect(usuario?.lockedUntil).not.toBeNull();
  });

  it("rechaza una cuenta bloqueada aunque la contraseña sea correcta", async () => {
    await crearUsuario({
      lockedUntil: new Date(Date.now() + LOCK_DURATION_MINUTES * 60_000),
    });

    const resultado = await authenticate(EMAIL, PASSWORD);

    expect(resultado).toEqual({ ok: false, reason: "ACCOUNT_LOCKED" });
  });

  it("vuelve a aceptar la cuenta cuando el bloqueo ya venció", async () => {
    await crearUsuario({
      failedLoginAttempts: MAX_FAILED_ATTEMPTS,
      lockedUntil: new Date(Date.now() - 60_000),
    });

    const resultado = await authenticate(EMAIL, PASSWORD);

    expect(resultado.ok).toBe(true);
  });

  it("rechaza una cuenta desactivada", async () => {
    await crearUsuario({ isActive: false });

    const resultado = await authenticate(EMAIL, PASSWORD);

    expect(resultado).toEqual({ ok: false, reason: "ACCOUNT_INACTIVE" });
  });

  it("verifica la contraseña antes que el estado de la cuenta", async () => {
    // Si se comprobara primero el estado, una contraseña equivocada revelaría
    // que la cuenta existe pero está desactivada.
    await crearUsuario({ isActive: false });

    const resultado = await authenticate(EMAIL, OTRA);

    expect(resultado).toEqual({ ok: false, reason: "INVALID_CREDENTIALS" });
  });

  it("reinicia el contador y registra la fecha al ingresar bien", async () => {
    await crearUsuario({ failedLoginAttempts: 3 });

    await authenticate(EMAIL, PASSWORD);

    const usuario = await prisma.user.findUnique({ where: { email: EMAIL } });
    expect(usuario?.failedLoginAttempts).toBe(0);
    expect(usuario?.lockedUntil).toBeNull();
    expect(usuario?.lastLoginAt).not.toBeNull();
  });

  it("deja registro en la auditoría de un ingreso correcto", async () => {
    const usuario = await crearUsuario();

    await authenticate(EMAIL, PASSWORD);

    const registro = await prisma.auditLog.findFirst({
      where: { action: "LOGIN_SUCCEEDED" },
    });
    expect(registro?.actorId).toBe(usuario.id);
  });

  it("deja registro en la auditoría de un intento fallido", async () => {
    await crearUsuario();

    await authenticate(EMAIL, OTRA);

    const registro = await prisma.auditLog.findFirst({
      where: { action: "LOGIN_FAILED" },
    });
    expect(registro).not.toBeNull();
  });

  it("nunca guarda la contraseña en la auditoría", async () => {
    await crearUsuario();

    await authenticate(EMAIL, OTRA);

    const registros = await prisma.auditLog.findMany({});
    expect(JSON.stringify(registros)).not.toContain(OTRA);
  });
});
