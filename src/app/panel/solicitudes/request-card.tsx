"use client";

import { useActionState, useState } from "react";
import { aprobar, rechazar, type EstadoDecision } from "./actions";

interface Props {
  id: string;
  requesterName: string;
  requesterEmail: string;
  reason: string;
  createdAt: string;
  projectTitle: string;
}

export function RequestCard({
  id,
  requesterName,
  requesterEmail,
  reason,
  createdAt,
  projectTitle,
}: Props) {
  const [aprobado, enviarAprobar, aprobando] = useActionState<EstadoDecision>(
    aprobar.bind(null, id),
    {},
  );
  const [rechazado, enviarRechazar, rechazando] = useActionState<
    EstadoDecision,
    FormData
  >(rechazar.bind(null, id), {});

  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const error = aprobado.error ?? rechazado.error;

  if (aprobado.enlace) {
    const enlaceCompleto =
      typeof window === "undefined"
        ? aprobado.enlace
        : `${window.location.origin}${aprobado.enlace}`;

    return (
      <li className="rounded-pieza bg-blanco p-6 ring-1 ring-morado ring-inset">
        <p className="font-titulo text-lg text-tinta">Solicitud aprobada</p>

        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-gris-texto">
          Envíale este enlace a {requesterName} ({requesterEmail}). Sirve{" "}
          <strong>una sola vez</strong> y caduca en siete días.{" "}
          <strong>No volverá a mostrarse</strong>: si lo pierdes, habrá que
          pedir una solicitud nueva.
        </p>

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
      </li>
    );
  }

  return (
    <li className="rounded-pieza bg-blanco p-6 ring-1 ring-gris ring-inset">
      <p className="text-sm text-gris-texto">{createdAt}</p>

      <p className="mt-1 font-titulo text-lg leading-snug text-tinta">
        {projectTitle}
      </p>

      <p className="mt-3 text-sm text-azul">
        {requesterName} · {requesterEmail}
      </p>

      <p className="mt-4 max-w-[60ch] rounded-pieza bg-papel px-4 py-3 text-sm leading-relaxed text-tinta">
        {reason}
      </p>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-bold text-azul">
          {error}
        </p>
      ) : null}

      {mostrarRechazo ? (
        <form action={enviarRechazar} className="mt-5">
          <label
            htmlFor={`nota-${id}`}
            className="mb-2 block text-sm font-bold text-tinta"
          >
            Motivo del rechazo (opcional)
          </label>
          <textarea
            id={`nota-${id}`}
            name="nota"
            rows={2}
            className="w-full max-w-lg rounded-pieza bg-blanco px-3.5 py-2.5 text-sm text-tinta ring-1 ring-gris ring-inset focus:ring-morado"
          />

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={rechazando}
              className="rounded-pieza bg-azul px-5 py-2.5 text-sm font-bold text-blanco transition-transform duration-200 active:scale-[0.98] disabled:opacity-60"
            >
              {rechazando ? "Rechazando" : "Confirmar rechazo"}
            </button>
            <button
              type="button"
              onClick={() => setMostrarRechazo(false)}
              className="text-sm text-morado-hondo underline underline-offset-4"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <form action={enviarAprobar}>
            <button
              type="submit"
              disabled={aprobando}
              className="rounded-pieza bg-morado px-5 py-2.5 text-sm font-bold text-blanco transition-[background-color,transform] duration-200 hover:bg-morado-hondo active:scale-[0.98] disabled:opacity-60"
            >
              {aprobando ? "Aprobando" : "Aprobar y generar enlace"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMostrarRechazo(true)}
            className="text-sm text-morado-hondo underline underline-offset-4"
          >
            Rechazar
          </button>
        </div>
      )}
    </li>
  );
}
