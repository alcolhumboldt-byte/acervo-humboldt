"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  approveRequest,
  reissueToken,
  rejectRequest,
  type Actor,
} from "@/modules/access/approvals";

export interface EstadoDecision {
  error?: string;
  /** El enlace solo existe en esta respuesta: no se guarda en ninguna parte. */
  enlace?: string;
}

async function actorActual(): Promise<Actor> {
  const sesion = await auth();

  if (!sesion?.user?.id || !sesion.user.role) {
    redirect("/ingresar");
  }

  return { id: sesion.user.id, role: sesion.user.role };
}

const MOTIVOS: Record<string, string> = {
  NOT_FOUND: "No encontramos esa solicitud.",
  NOT_ALLOWED: "Solo un administrador puede decidir sobre las solicitudes.",
  ALREADY_DECIDED: "Esa solicitud ya estaba decidida.",
};

export async function aprobar(
  id: string,
  _anterior: EstadoDecision,
): Promise<EstadoDecision> {
  const actor = await actorActual();
  const r = await approveRequest(id, actor);

  if (!r.ok) {
    return { error: MOTIVOS[r.reason] ?? "No se pudo." };
  }

  // Sin revalidar a propósito: recargar la lista desde el servidor barrería
  // la tarjeta que acaba de recibir el enlace, y de ese enlace solo queda su
  // huella. Se perdería sin remedio.
  return { enlace: `/documentos/${r.token}` };
}

export async function reemitir(
  id: string,
  _anterior: EstadoDecision,
): Promise<EstadoDecision> {
  const actor = await actorActual();
  const r = await reissueToken(id, actor);

  if (!r.ok) {
    return { error: MOTIVOS[r.reason] ?? "No se pudo." };
  }

  return { enlace: `/documentos/${r.token}` };
}

export async function rechazar(
  id: string,
  _anterior: EstadoDecision,
  datos: FormData,
): Promise<EstadoDecision> {
  const actor = await actorActual();
  const nota = datos.get("nota");
  const r = await rejectRequest(
    id,
    actor,
    typeof nota === "string" ? nota : "",
  );

  if (!r.ok) {
    return { error: MOTIVOS[r.reason] ?? "No se pudo." };
  }

  revalidatePath("/panel/solicitudes");
  return {};
}
