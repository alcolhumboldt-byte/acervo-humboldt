"use client";

import { useActionState, useState } from "react";
import { reemitir, type EstadoDecision } from "./actions";

interface Props {
  id: string;
  requesterName: string;
  requesterEmail: string;
  decidedAt: string;
  projectTitle: string;
  usado: boolean;
  caducado: boolean;
}

export function ApprovedCard({
  id,
  requesterName,
  requesterEmail,
  decidedAt,
  projectTitle,
  usado,
  caducado,
}: Props) {
  const [estado, generar, generando] = useActionState<EstadoDecision>(
    reemitir.bind(null, id),
    {},
  );
  const [copiado, setCopiado] = useState(false);

  const enlaceCompleto =
    estado.enlace && typeof window !== "undefined"
      ? `${window.location.origin}${estado.enlace}`
      : estado.enlace;

  const situacion = usado
    ? "Enlace ya usado"
    : caducado
      ? "Enlace caducado"
      : "Enlace sin usar";

  return (
    <li className="rounded-pieza bg-blanco p-6 ring-1 ring-gris ring-inset">
      <p className="text-sm text-gris-texto">
        Aprobada el {decidedAt} · {situacion}
      </p>

      <p className="mt-1 font-titulo text-lg leading-snug text-tinta">
        {projectTitle}
      </p>

      <p className="mt-2 text-sm text-azul">
        {requesterName} · {requesterEmail}
      </p>

      {estado.error ? (
        <p role="alert" className="mt-4 text-sm font-bold text-azul">
          {estado.error}
        </p>
      ) : null}

      {enlaceCompleto ? (
        <>
          <p className="mt-4 rounded-pieza bg-papel px-4 py-3 font-mono text-sm break-all text-tinta">
            {enlaceCompleto}
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(enlaceCompleto);
              setCopiado(true);
            }}
            className="mt-4 rounded-pieza bg-morado px-5 py-2.5 text-sm font-bold text-blanco transition-transform duration-200 active:scale-[0.98]"
          >
            {copiado ? "Copiado" : "Copiar enlace"}
          </button>
        </>
      ) : (
        <form action={generar} className="mt-4">
          <button
            type="submit"
            disabled={generando}
            className="rounded-pieza bg-blanco px-5 py-2.5 text-sm font-bold text-morado-hondo ring-1 ring-gris ring-inset transition-transform duration-200 active:scale-[0.98] disabled:opacity-60"
          >
            {generando ? "Generando" : "Generar enlace nuevo"}
          </button>
        </form>
      )}
    </li>
  );
}
