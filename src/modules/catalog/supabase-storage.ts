import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { DocumentStorage } from "@/modules/catalog/attach-document";

/**
 * Almacenamiento real de los documentos, en Supabase.
 *
 * El depósito es privado: nadie descarga un PDF por su dirección. El acceso se
 * concederá con enlaces firmados y temporales, previa aprobación, que es el
 * módulo que falta por construir.
 *
 * Usa la clave de servicio, que salta las reglas de acceso de la base. Por eso
 * este archivo está marcado como «server-only»: si llegara al navegador,
 * entregaría a cualquiera el control total del almacenamiento.
 */

export const BUCKET_DOCUMENTOS = "documentos";

function leerEntorno(nombre: string): string | undefined {
  const entorno: Record<string, string | undefined> = process.env;
  return entorno[nombre];
}

function cliente() {
  const url = leerEntorno("SUPABASE_URL");
  const clave = leerEntorno("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !clave) {
    throw new Error(
      "Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. Sin ellas no se " +
        "pueden guardar los documentos.",
    );
  }

  return createClient(url, clave, { auth: { persistSession: false } });
}

export const supabaseStorage: DocumentStorage = {
  /**
   * Permiso temporal para escribir una sola vez en esa ruta.
   *
   * Es lo único que viaja al navegador. La clave de servicio se queda aquí:
   * con ella, quien la tuviera podría leer y borrar todos los documentos.
   */
  async createUploadUrl(path) {
    const { data, error } = await cliente()
      .storage.from(BUCKET_DOCUMENTOS)
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new Error(
        `No se pudo preparar la subida: ${error?.message ?? "sin detalle"}`,
      );
    }

    return { url: data.signedUrl, token: data.token };
  },

  async download(path) {
    const { data, error } = await cliente()
      .storage.from(BUCKET_DOCUMENTOS)
      .download(path);

    if (error || !data) {
      throw new Error(
        `No se pudo leer el documento: ${error?.message ?? "sin detalle"}`,
      );
    }

    return new Uint8Array(await data.arrayBuffer());
  },

  async remove(path) {
    const { error } = await cliente()
      .storage.from(BUCKET_DOCUMENTOS)
      .remove([path]);

    if (error) {
      throw new Error(`No se pudo borrar el documento: ${error.message}`);
    }
  },
};
