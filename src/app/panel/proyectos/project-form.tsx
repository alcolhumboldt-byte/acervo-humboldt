"use client";

import { useActionState, useState } from "react";
import { gradeLabel } from "@/modules/discovery/grades";
import type { EstadoFormulario } from "./actions";

interface AutorInicial {
  givenNames: string;
  familyNames: string;
  fullNameAuthorized: boolean;
}

interface Props {
  accion: (
    anterior: EstadoFormulario,
    datos: FormData,
  ) => Promise<EstadoFormulario>;
  inicial?: {
    title: string;
    summary: string;
    area: string;
    gradeLevel: number;
    year: number;
    authors: AutorInicial[];
  };
  textoBoton: string;
}

/** Sugerencias, no una lista cerrada: la relación oficial de áreas del
 *  colegio está sin confirmar. */
const AREAS = [
  "Ciencias naturales",
  "Ciencias sociales",
  "Matemáticas",
  "Lengua castellana",
  "Educación artística",
  "Tecnología e informática",
  "Educación física",
  "Idioma extranjero",
  "Ética y valores",
  "Educación religiosa",
];

const VACIO: AutorInicial = {
  givenNames: "",
  familyNames: "",
  fullNameAuthorized: false,
};

const campo =
  "w-full rounded-pieza bg-blanco px-3.5 py-2.5 text-tinta ring-1 ring-gris ring-inset transition-shadow duration-200 focus:ring-morado";
const etiqueta = "mb-2 block text-sm font-bold text-tinta";

export function ProjectForm({ accion, inicial, textoBoton }: Props) {
  const [estado, enviar, enviando] = useActionState(accion, {});
  const [autores, setAutores] = useState<AutorInicial[]>(
    inicial?.authors.length ? inicial.authors : [VACIO],
  );

  return (
    <form action={enviar} className="mt-8 max-w-3xl">
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
          <label htmlFor="titulo" className={etiqueta}>
            Título del proyecto
          </label>
          <input
            id="titulo"
            name="titulo"
            defaultValue={inicial?.title}
            required
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="resumen" className={etiqueta}>
            Resumen
          </label>
          <textarea
            id="resumen"
            name="resumen"
            rows={4}
            defaultValue={inicial?.summary}
            required
            className={campo}
          />
          <p className="mt-2 text-sm text-gris-texto">
            Dos o tres frases sobre qué hicieron los estudiantes. Es lo que se
            lee en el portal público.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <label htmlFor="area" className={etiqueta}>
              Área
            </label>
            <input
              id="area"
              name="area"
              list="areas"
              defaultValue={inicial?.area}
              required
              className={campo}
            />
            <datalist id="areas">
              {AREAS.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="grado" className={etiqueta}>
              Grado
            </label>
            <select
              id="grado"
              name="grado"
              defaultValue={inicial?.gradeLevel ?? 6}
              className={campo}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {gradeLabel(i)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="anio" className={etiqueta}>
              Año lectivo
            </label>
            <input
              id="anio"
              name="anio"
              type="number"
              min={2000}
              max={new Date().getFullYear() + 1}
              defaultValue={inicial?.year ?? new Date().getFullYear()}
              required
              className={campo}
            />
          </div>
        </div>
      </div>

      <fieldset className="mt-10 border-t border-gris pt-8">
        <legend className="sr-only">Autores</legend>

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-titulo text-xl tracking-tight text-tinta">
            Autores
          </h2>
          <p className="text-sm text-gris-texto">
            Se guardan completos, pero el portal solo muestra el nombre y la
            inicial del apellido.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {autores.map((autor, i) => (
            <div
              key={i}
              className="rounded-pieza bg-blanco p-5 ring-1 ring-gris ring-inset"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`autor-${i}-nombres`} className={etiqueta}>
                    Nombres
                  </label>
                  <input
                    id={`autor-${i}-nombres`}
                    name={`autor-${i}-nombres`}
                    defaultValue={autor.givenNames}
                    className={campo}
                  />
                </div>

                <div>
                  <label htmlFor={`autor-${i}-apellidos`} className={etiqueta}>
                    Apellidos
                  </label>
                  <input
                    id={`autor-${i}-apellidos`}
                    name={`autor-${i}-apellidos`}
                    defaultValue={autor.familyNames}
                    className={campo}
                  />
                </div>
              </div>

              <label className="mt-4 flex items-start gap-3 text-sm text-tinta">
                <input
                  type="checkbox"
                  name={`autor-${i}-autorizado`}
                  value="si"
                  defaultChecked={autor.fullNameAuthorized}
                  className="mt-1"
                />
                <span>
                  La familia firmó la autorización para mostrar el nombre
                  completo.
                  <span className="mt-1 block text-gris-texto">
                    Sin esta marca, el portal muestra «Nombre A.».
                  </span>
                </span>
              </label>

              {autores.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setAutores(autores.filter((_, j) => j !== i))
                  }
                  className="mt-4 text-sm text-morado-hondo underline underline-offset-4"
                >
                  Quitar este autor
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAutores([...autores, VACIO])}
          className="mt-5 rounded-pieza px-4 py-2 text-sm font-bold text-morado-hondo underline underline-offset-4 transition-transform duration-200 active:scale-[0.98]"
        >
          Añadir otro autor
        </button>
      </fieldset>

      <div className="mt-10 border-t border-gris pt-8">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-pieza bg-morado px-6 py-3 font-bold text-blanco transition-[background-color,transform] duration-200 hover:bg-morado-hondo active:scale-[0.98] disabled:opacity-60"
        >
          {enviando ? "Guardando" : textoBoton}
        </button>
      </div>
    </form>
  );
}
