"use server";

import { redirect } from "next/navigation";
import { redeemToken } from "@/modules/access/approvals";
import { supabaseStorage } from "@/modules/catalog/supabase-storage";

export interface EstadoEntrega {
  error?: string;
}

const MOTIVOS: Record<string, string> = {
  NOT_FOUND: "Este enlace no es válido.",
  ALREADY_USED: "Este enlace ya se usó. Sirve una sola vez.",
  EXPIRED: "Este enlace caducó.",
  NO_DOCUMENT: "El documento ya no está disponible.",
};

/** Minutos que dura la dirección de descarga una vez canjeado el enlace. */
const SEGUNDOS_DE_DESCARGA = 300;

export async function entregarDocumento(
  token: string,
  _anterior: EstadoEntrega,
): Promise<EstadoEntrega> {
  const r = await redeemToken(token);

  if (!r.ok) {
    return { error: MOTIVOS[r.reason] ?? "No se pudo entregar el documento." };
  }

  // El enlace ya quedó gastado. Se entrega una dirección de descarga que
  // caduca sola, con el nombre del proyecto y no el del archivo guardado.
  const descarga = await supabaseStorage.createSignedUrl(
    r.documentPath,
    SEGUNDOS_DE_DESCARGA,
    `${r.projectSlug}.pdf`,
  );

  redirect(descarga);
}
