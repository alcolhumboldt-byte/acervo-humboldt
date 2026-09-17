import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/modules/identity/password-hashing";

/**
 * Verificación de credenciales del personal.
 *
 * El orden importa: primero el bloqueo, después la contraseña y solo al final
 * el estado de la cuenta. Comprobar el estado antes que la contraseña
 * permitiría averiguar qué correos corresponden a cuentas reales probando
 * contraseñas cualesquiera.
 *
 * Los motivos que devuelve son para la auditoría, no para mostrarlos. La
 * interfaz debe traducirlos todos a un único mensaje genérico: distinguir
 * «contraseña incorrecta» de «cuenta bloqueada» revela que el correo existe.
 */

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MINUTES = 15;

export type AuthFailureReason =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_INACTIVE";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "DOCENTE";
}

export type AuthResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; reason: AuthFailureReason };

/** Hash descartable, usado solo para gastar tiempo cuando el correo no existe. */
let dummyHash: string | undefined;

/**
 * Cuando el correo no existe no hay nada que comparar, y responder de
 * inmediato delataría por el tiempo de respuesta que la cuenta no está
 * registrada. Se cifra una contraseña ficticia para que ambos casos tarden
 * aproximadamente lo mismo.
 */
async function burnTime(password: string): Promise<void> {
  dummyHash ??= await hashPassword("contraseña-inexistente-para-igualar-tiempos");
  await verifyPassword(dummyHash, password);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function record(
  action: string,
  actorId: string | null,
  metadata: Prisma.InputJsonObject,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action,
      entityType: "User",
      entityId: actorId,
      actorId,
      metadata,
    },
  });
}

export async function authenticate(
  email: string,
  password: string,
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });

  if (!user) {
    await burnTime(password);
    await record("LOGIN_FAILED", null, { reason: "UNKNOWN_EMAIL" });
    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await record("LOGIN_FAILED", user.id, { reason: "ACCOUNT_LOCKED" });
    return { ok: false, reason: "ACCOUNT_LOCKED" };
  }

  if (!(await verifyPassword(user.passwordHash, password))) {
    const attempts = user.failedLoginAttempts + 1;
    const reachedLimit = attempts >= MAX_FAILED_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: reachedLimit
          ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60_000)
          : null,
      },
    });

    await record("LOGIN_FAILED", user.id, {
      reason: "WRONG_PASSWORD",
      attempts,
    });

    if (reachedLimit) {
      await record("ACCOUNT_LOCKED", user.id, { attempts });
    }

    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  if (!user.isActive) {
    await record("LOGIN_FAILED", user.id, { reason: "ACCOUNT_INACTIVE" });
    return { ok: false, reason: "ACCOUNT_INACTIVE" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  await record("LOGIN_SUCCEEDED", user.id, {});

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}
