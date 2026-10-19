"use server";

import {
  createDocumentRequest,
  REQUEST_MESSAGES,
} from "@/modules/access/requests";

export interface EstadoSolicitud {
  errores?: string[];
  enviada?: boolean;
}

const MOTIVOS: Record<string, string> = {
  NOT_FOUND: "No encontramos ese proyecto.",
  NO_DOCUMENT: "Este proyecto todavía no tiene documento.",
};

export async function solicitarDocumento(
  slug: string,
  _anterior: EstadoSolicitud,
  datos: FormData,
): Promise<EstadoSolicitud> {
  const texto = (clave: string) => {
    const valor = datos.get(clave);
    return typeof valor === "string" ? valor : "";
  };

  const resultado = await createDocumentRequest(slug, {
    requesterName: texto("nombre"),
    requesterEmail: texto("correo"),
    reason: texto("motivo"),
  });

  if (resultado.ok) {
    return { enviada: true };
  }

  return {
    errores:
      "reasons" in resultado
        ? resultado.reasons.map((r) => REQUEST_MESSAGES[r])
        : [MOTIVOS[resultado.reason] ?? "No se pudo enviar la solicitud."],
  };
}
