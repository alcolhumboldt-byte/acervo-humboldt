"use client";

import { useActionState } from "react";
import type { ProjectStatus } from "@/generated/prisma/enums";
import { STATUS_ACTIONS } from "@/modules/catalog/status";
import { cambiarEstado } from "./actions";

interface Props {
  id: string;
  permitidos: ProjectStatus[];
}

export function StatusActions({ id, permitidos }: Props) {
  const [estado, enviar, enviando] = useActionState(cambiarEstado, {});

  if (permitidos.length === 0) {
    return (
      <p className="text-sm text-gris-texto">
        No hay cambios de estado disponibles para tu rol.
      </p>
    );
  }

  return (
    <div>
      {estado.errores?.length ? (
        <p
          role="alert"
          className="mb-4 rounded-pieza border-l-[3px] border-azul bg-blanco px-4 py-3 text-sm text-azul"
        >
          {estado.errores.join(" ")}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {permitidos.map((siguiente) => (
          <form key={siguiente} action={enviar}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="siguiente" value={siguiente} />
            <button
              type="submit"
              disabled={enviando}
              className={
                siguiente === "PUBLISHED"
                  ? "rounded-pieza bg-morado px-5 py-2.5 text-sm font-bold text-blanco transition-[background-color,transform] duration-200 hover:bg-morado-hondo active:scale-[0.98] disabled:opacity-60"
                  : "rounded-pieza bg-blanco px-5 py-2.5 text-sm font-bold text-morado-hondo ring-1 ring-gris ring-inset transition-transform duration-200 active:scale-[0.98] disabled:opacity-60"
              }
            >
              {STATUS_ACTIONS[siguiente]}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
