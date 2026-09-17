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
          <h1 className="mt-1 font-titulo text-3xl text-tinta">
            Ingreso del personal
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gris-texto">
            Este panel es solo para docentes y administradores del colegio.
          </p>
        </div>

        <form
          action={accion}
          className="rounded-lg border border-gris bg-blanco p-6 shadow-sm"
        >
          {estado.error ? (
            <p
              role="alert"
              className="mb-5 rounded-md border border-azul bg-papel px-4 py-3 text-sm text-azul"
            >
              {estado.error}
            </p>
          ) : null}

          {estado.ok ? (
            <p
              role="status"
              className="mb-5 rounded-md border border-morado bg-papel px-4 py-3 text-sm text-morado-hondo"
            >
              Datos verificados correctamente.
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
              className="w-full rounded-md border border-gris bg-blanco px-3 py-2 text-tinta"
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
              className="w-full rounded-md border border-gris bg-blanco px-3 py-2 text-tinta"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-morado px-4 py-2.5 font-bold text-blanco transition-colors hover:bg-morado-hondo disabled:opacity-60"
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
