/**
 * Comprueba que el almacenamiento de documentos está bien configurado.
 *
 * Sube un PDF diminuto, lo descarga, compara los bytes y lo borra. Sirve para
 * separar un fallo de credenciales o de depósito de un fallo de la aplicación,
 * que desde el navegador se ven igual.
 *
 *   npm run verificar:almacenamiento
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { supabaseStorage } from "../src/modules/catalog/supabase-storage";

const ruta = `proyectos/prueba-conexion/${randomUUID()}.pdf`;
const contenido = new TextEncoder().encode("%PDF-1.7\nprueba de conexion\n");

async function main() {
  console.log("1. Pidiendo permiso de subida…");
  const { url } = await supabaseStorage.createUploadUrl(ruta);
  console.log("   permiso concedido");

  console.log("2. Subiendo un PDF de prueba…");
  const respuesta = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/pdf" },
    body: contenido,
  });
  if (!respuesta.ok) {
    throw new Error(`la subida falló: ${respuesta.status} ${await respuesta.text()}`);
  }
  console.log("   subido");

  console.log("3. Descargándolo para comprobarlo…");
  const leido = await supabaseStorage.download(ruta);
  const iguales =
    leido.length === contenido.length &&
    leido.every((b, i) => b === contenido[i]);
  console.log(`   ${leido.length} bytes, contenido idéntico: ${iguales}`);

  console.log("4. Borrando el archivo de prueba…");
  await supabaseStorage.remove(ruta);
  console.log("   borrado");

  console.log("\nTODO CORRECTO: el almacenamiento funciona.");
}

main().catch((e: unknown) => {
  console.error("\nFALLÓ:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
