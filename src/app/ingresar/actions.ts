"use server";

import { authenticate } from "@/modules/identity/authenticate";

export interface EstadoIngreso {
  error?: string;
  ok?: boolean;
}

/**
 * Un único mensaje para todos los fallos posibles.
 *
 * Distinguir «contraseña incorrecta» de «cuenta bloqueada» o «cuenta
 * desactivada» le diría a quien prueba al azar cuáles correos corresponden a
 * personal del colegio.
 */
const MENSAJE_GENERICO =
  "No pudimos verificar esos datos. Revisa tu correo y tu contraseña.";

export async function ingresar(
  _anterior: EstadoIngreso,
  datos: FormData,
): Promise<EstadoIngreso> {
  const email = String(datos.get("email") ?? "");
  const password = String(datos.get("password") ?? "");

  if (!email || !password) {
    return { error: "Escribe tu correo y tu contraseña." };
  }

  const resultado = await authenticate(email, password);

  return resultado.ok ? { ok: true } : { error: MENSAJE_GENERICO };
}
