"use client";

import { useActionState } from "react";
import { entregarDocumento, type EstadoEntrega } from "./actions";

export function DownloadButton({ token }: { token: string }) {
  const [estado, entregar, entregando] = useActionState<EstadoEntrega>(
    entregarDocumento.bind(null, token),
    {},
  );

  return (
    <div className="mt-8">
      {estado.error ? (
        <p
          role="alert"
          className="mb-5 rounded-pieza border-l-[3px] border-azul bg-blanco px-4 py-3 text-sm text-azul"
        >
          {estado.error}
        </p>
      ) : null}

      <form action={entregar}>
        <button
          type="submit"
          disabled={entregando}
          className="rounded-pieza bg-morado px-6 py-3 font-bold text-blanco shadow-capa transition-[background-color,transform] duration-200 hover:bg-morado-hondo active:scale-[0.98] disabled:opacity-60"
        >
          {entregando ? "Preparando la descarga" : "Descargar el documento"}
        </button>
      </form>

      <p className="mt-3 text-sm text-gris-texto">
        Al pulsar, el enlace queda usado y no volverá a funcionar.
      </p>
    </div>
  );
}
