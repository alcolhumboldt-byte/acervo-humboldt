import "dotenv/config";
import { randomBytes } from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/modules/identity/password-hashing";
import {
  PASSWORD_ISSUE_MESSAGES,
  validatePassword,
} from "../src/modules/identity/password-policy";

/**
 * Crea la primera cuenta de administrador.
 *
 * No inventa credenciales fijas: si no se entrega una contraseña, genera una
 * aleatoria y la muestra una sola vez. Nunca sobrescribe una cuenta existente,
 * para que volver a ejecutar el seed no le cambie la contraseña a nadie.
 */

const email = process.env.SEED_ADMIN_EMAIL;
const name = process.env.SEED_ADMIN_NAME ?? "Administrador";

function generatePassword(): string {
  for (let intento = 0; intento < 50; intento += 1) {
    const candidata = randomBytes(18).toString("base64url");

    if (validatePassword(candidata, { email, name }).valid) {
      return candidata;
    }
  }

  throw new Error(
    "No fue posible generar una contraseña que cumpla la política.",
  );
}

async function main(): Promise<void> {
  if (!email) {
    throw new Error(
      "Falta SEED_ADMIN_EMAIL. Ejemplo:\n" +
        '  SEED_ADMIN_EMAIL="admin@colegio.edu.co" npm run db:seed',
    );
  }

  const entregada = process.env.SEED_ADMIN_PASSWORD;
  const password = entregada ?? generatePassword();

  const politica = validatePassword(password, { email, name });

  if (!politica.valid) {
    const detalle = politica.reasons
      .map((motivo) => `  - ${PASSWORD_ISSUE_MESSAGES[motivo]}`)
      .join("\n");

    throw new Error(
      `La contraseña entregada no cumple la política:\n${detalle}`,
    );
  }

  const existente = await prisma.user.findUnique({ where: { email } });

  if (existente) {
    console.log(
      `La cuenta ${email} ya existe. No se modifica nada.\n` +
        "Para cambiar su contraseña usa el flujo de restablecimiento.",
    );
    return;
  }

  const usuario = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
    },
  });

  // El seed no tiene una persona detrás, así que el actor queda vacío.
  // No se guarda el correo: basta el identificador para auditar.
  await prisma.auditLog.create({
    data: {
      action: "USER_CREATED",
      entityType: "User",
      entityId: usuario.id,
      metadata: { via: "seed", role: "ADMIN" },
    },
  });

  console.log(`Cuenta de administrador creada: ${email}`);

  if (!entregada) {
    console.log(
      "\nContraseña generada (se muestra una sola vez, guárdala ahora):\n" +
        `\n    ${password}\n`,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
