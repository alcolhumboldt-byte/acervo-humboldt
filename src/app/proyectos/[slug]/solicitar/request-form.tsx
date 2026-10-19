"use client";

import { useActionState } from "react";
import { solicitarDocumento, type EstadoSolicitud } from "./actions";

const campo =
  "w-full rounded-pieza bg-blanco px-3.5 py-2.5 text-tinta ring-1 ring-gris ring-inset transition-shadow duration-200 focus:ring-morado";
const etiqueta = "mb-2 block text-sm font-bold text-tinta";

export function RequestForm({ slug }: { slug: string }) {
  const [estado, enviar, enviando] = useActionState<EstadoSolicitud, FormData>(
    solicitarDocumento.bind(null, slug),
    {},
  );

  if (estado.enviada) {
    return (
      <div
        role="status"
        className="mt-8 rounded-pieza border-l-[3px] border-morado bg-blanco px-6 py-5"
      >
        <p className="font-titulo text-xl text-tinta">Solicitud enviada</p>
        <p className="mt-3 max-w-[58ch] leading-relaxed text-gris-texto">
          El colegio la revisará y te responderá al correo que dejaste. No todas
          las solicitudes se aprueban: se trata de trabajos de estudiantes
          menores de edad.
        </p>
      </div>
    );
  }

  return (
    <form action={enviar} className="mt-8 max-w-xl">
      {estado.errores?.length ? (
        <div
          role="alert"
          className="mb-8 rounded-pieza border-l-[3px] border-azul bg-blanco px-5 py-4"
        >
          <p className="font-bold text-azul">Revisa estos puntos:</p>
          <ul className="mt-2 space-y-1 text-sm text-azul">
            {estado.errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-6">
        <div>
          <label htmlFor="nombre" className={etiqueta}>
            Tu nombre
          </label>
          <input id="nombre" name="nombre" required className={campo} />
        </div>

        <div>
          <label htmlFor="correo" className={etiqueta}>
            Tu correo
          </label>
          <input
            id="correo"
            name="correo"
            type="email"
            required
            className={campo}
          />
          <p className="mt-2 text-sm text-gris-texto">
            Es donde recibirás la respuesta. No se publica en ninguna parte.
          </p>
        </div>

        <div>
          <label htmlFor="motivo" className={etiqueta}>
            ¿Para qué necesitas el documento?
          </label>
          <textarea
            id="motivo"
            name="motivo"
            rows={4}
            required
            className={campo}
          />
          <p className="mt-2 text-sm leading-relaxed text-gris-texto">
            Cuéntalo con un par de frases. Es lo único con lo que cuenta el
            colegio para decidir.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="mt-8 rounded-pieza bg-morado px-6 py-3 font-bold text-blanco transition-[background-color,transform] duration-200 hover:bg-morado-hondo active:scale-[0.98] disabled:opacity-60"
      >
        {enviando ? "Enviando" : "Enviar solicitud"}
      </button>
    </form>
  );
}
