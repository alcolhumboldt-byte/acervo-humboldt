"use client";

import { useActionState } from "react";
import { ingresar, type EstadoIngreso } from "./actions";

const INICIAL: EstadoIngreso = {};

export default function Ingresar() {
  const [estado, accion, enviando] = useActionState(ingresar, INICIAL);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm tracking-wide text-gris-texto">Acervo</p>
          <h1 className="mt-1 font-titulo text-3xl tracking-tight text-tinta">
            Ingreso del personal
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gris-texto">
            Este panel es solo para docentes y administradores del colegio.
          </p>
        </div>

        <form
          action={accion}
          className="rounded-pieza bg-blanco p-7 shadow-capa ring-1 ring-gris ring-inset"
        >
          {estado.error ? (
            <p
              role="alert"
              className="mb-6 rounded-pieza border-l-[3px] border-azul bg-papel px-4 py-3 text-sm leading-relaxed text-azul"
            >
              {estado.error}
            </p>
          ) : null}

          <div className="mb-5">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-bold text-tinta"
            >
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="w-full rounded-pieza bg-blanco px-3.5 py-2.5 text-tinta ring-1 ring-gris ring-inset transition-shadow duration-200 focus:ring-morado"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-bold text-tinta"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-pieza bg-blanco px-3.5 py-2.5 text-tinta ring-1 ring-gris ring-inset transition-shadow duration-200 focus:ring-morado"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-pieza bg-morado px-4 py-3 font-bold text-blanco transition-[background-color,transform] duration-200 hover:bg-morado-hondo active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
          >
            {enviando ? "Verificando" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-sm text-gris-texto">
          ¿Olvidaste tu contraseña? Escribe a la persona que administra el
          repositorio.
        </p>
      </div>
    </main>
  );
}
