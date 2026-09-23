"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MAX_DOCUMENT_BYTES } from "@/modules/catalog/document";
import {
  confirmarDocumento,
  prepararDocumento,
  quitarDocumento,
} from "./actions";

interface Props {
  projectId: string;
  documento: { size: number | null; uploadedAt: Date | null } | null;
}

function pesoLegible(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export function DocumentUpload({ projectId, documento }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [quitando, iniciarQuitar] = useTransition();

  async function subir(archivo: File) {
    setError(null);

    // Comprobación rápida antes de gastar la subida. La de verdad la hace el
    // servidor después, descargando el archivo: esta es solo cortesía.
    if (archivo.size > MAX_DOCUMENT_BYTES) {
      setError("El PDF no puede superar los 25 MB.");
      return;
    }

    setSubiendo(true);

    try {
      const permiso = await prepararDocumento(projectId);

      if (!permiso.ok) {
        setError(permiso.error);
        return;
      }

      const respuesta = await fetch(permiso.url, {
        method: "PUT",
        headers: { "content-type": "application/pdf" },
        body: archivo,
      });

      if (!respuesta.ok) {
        setError("No se pudo subir el archivo al almacenamiento.");
        return;
      }

      const confirmado = await confirmarDocumento(projectId, permiso.path);

      if (!confirmado.ok) {
        setError(confirmado.error);
        return;
      }

      router.refresh();
    } catch {
      setError("Se interrumpió la subida. Revisa tu conexión.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div>
      {error ? (
        <p
          role="alert"
          className="mb-5 rounded-pieza border-l-[3px] border-azul bg-blanco px-4 py-3 text-sm text-azul"
        >
          {error}
        </p>
      ) : null}

      {documento?.uploadedAt ? (
        <div className="rounded-pieza bg-blanco p-5 ring-1 ring-gris ring-inset">
          <p className="font-bold text-tinta">Documento cargado</p>
          <p className="mt-1 text-sm text-gris-texto">
            {documento.size === null ? "" : `${pesoLegible(documento.size)} · `}
            subido el{" "}
            {new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(
              documento.uploadedAt,
            )}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gris-texto">
            No se puede abrir desde aquí: los documentos solo se entregan por
            solicitud aprobada, y esa parte aún no está construida.
          </p>

          <button
            type="button"
            disabled={quitando}
            onClick={() =>
              iniciarQuitar(async () => {
                const r = await quitarDocumento(projectId);
                if (!r.ok) setError(r.error);
                else router.refresh();
              })
            }
            className="mt-4 text-sm text-morado-hondo underline underline-offset-4 disabled:opacity-60"
          >
            {quitando ? "Quitando" : "Quitar documento"}
          </button>
        </div>
      ) : null}

      <div className="mt-5">
        <label
          htmlFor="documento"
          className="mb-2 block text-sm font-bold text-tinta"
        >
          {documento?.uploadedAt ? "Reemplazar el PDF" : "Subir el PDF"}
        </label>
        <input
          id="documento"
          type="file"
          accept="application/pdf"
          disabled={subiendo}
          onChange={(evento) => {
            const archivo = evento.target.files?.[0];
            if (archivo) void subir(archivo);
            evento.target.value = "";
          }}
          className="block w-full max-w-md text-sm text-gris-texto file:mr-4 file:rounded-pieza file:border-0 file:bg-morado file:px-5 file:py-2.5 file:font-bold file:text-blanco hover:file:bg-morado-hondo disabled:opacity-60"
        />
        <p className="mt-2 text-sm text-gris-texto">
          {subiendo
            ? "Subiendo el archivo…"
            : "Solo PDF, hasta 25 MB. El archivo va directo al almacenamiento privado."}
        </p>
      </div>
    </div>
  );
}
