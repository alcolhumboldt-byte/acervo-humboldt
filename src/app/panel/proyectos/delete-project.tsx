"use client";

import { useActionState, useState } from "react";
import { eliminarProyecto, type EstadoFormulario } from "./actions";

/**
 * Eliminar va en dos pasos a propósito.
 *
 * Es la única acción del panel sin vuelta atrás, y está a un dedo de distancia
 * de los botones de guardar. Un clic accidental no debería bastar.
 */
export function DeleteProject({
  projectId,
  titulo,
}: {
  projectId: string;
  titulo: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [estado, eliminar, eliminando] = useActionState<EstadoFormulario>(
    eliminarProyecto.bind(null, projectId),
    {},
  );

  return (
    <div className="mt-12 rounded-pieza border border-azul bg-blanco p-6">
      <h2 className="font-titulo text-xl tracking-tight text-tinta">
        Eliminar este proyecto
      </h2>

      <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-gris-texto">
        Desaparecen el proyecto, sus autores, su documento y las solicitudes
        que haya recibido. No se puede deshacer.
      </p>

      <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-gris-texto">
        Si solo quieres retirarlo del portal, usa <strong>Archivar</strong>:
        deja de ser público y conserva todo.
      </p>

      {estado.errores?.length ? (
        <p role="alert" className="mt-4 text-sm font-bold text-azul">
          {estado.errores.join(" ")}
        </p>
      ) : null}

      {confirmando ? (
        <div className="mt-5">
          <p className="text-sm font-bold text-tinta">
            ¿Eliminar «{titulo}» definitivamente?
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <form action={eliminar}>
              <button
                type="submit"
                disabled={eliminando}
                className="rounded-pieza bg-azul px-5 py-2.5 text-sm font-bold text-blanco transition-transform duration-200 active:scale-[0.98] disabled:opacity-60"
              >
                {eliminando ? "Eliminando" : "Sí, eliminar"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="text-sm text-morado-hondo underline underline-offset-4"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="mt-5 rounded-pieza bg-blanco px-5 py-2.5 text-sm font-bold text-azul ring-1 ring-azul ring-inset transition-transform duration-200 active:scale-[0.98]"
        >
          Eliminar proyecto
        </button>
      )}
    </div>
  );
}
