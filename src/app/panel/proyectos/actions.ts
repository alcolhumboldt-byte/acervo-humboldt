"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectStatus } from "@/generated/prisma/enums";
import { auth } from "@/auth";
import {
  createProject,
  changeStatus,
  updateProject,
  VALIDATION_MESSAGES,
  type Actor,
  type AuthorInput,
  type ProjectInput,
} from "@/modules/catalog/projects";

export interface EstadoFormulario {
  errores?: string[];
}

/**
 * Cada acción vuelve a comprobar la sesión.
 *
 * El middleware protege las páginas, pero una acción de servidor es una
 * dirección propia a la que se puede llamar directamente. Confiar en que
 * «solo se llega desde el panel» dejaría la puerta abierta.
 */
async function actorActual(): Promise<Actor> {
  const sesion = await auth();

  if (!sesion?.user?.id || !sesion.user.role) {
    redirect("/ingresar");
  }

  return { id: sesion.user.id, role: sesion.user.role };
}

function texto(datos: FormData, clave: string): string {
  const valor = datos.get(clave);
  return typeof valor === "string" ? valor : "";
}

function numero(datos: FormData, clave: string): number {
  const valor = Number(texto(datos, clave));
  return Number.isFinite(valor) ? valor : Number.NaN;
}

/**
 * Los autores llegan numerados —autor-0-nombres, autor-1-nombres…— porque una
 * casilla sin marcar no se envía, y con listas simples no habría forma de
 * saber a qué autor corresponde cada marca.
 */
function autores(datos: FormData): AuthorInput[] {
  const lista: AuthorInput[] = [];

  for (let i = 0; i < 30; i += 1) {
    const nombres = texto(datos, `autor-${i}-nombres`);
    const apellidos = texto(datos, `autor-${i}-apellidos`);

    if (nombres.trim() === "" && apellidos.trim() === "") {
      continue;
    }

    lista.push({
      givenNames: nombres,
      familyNames: apellidos,
      fullNameAuthorized: texto(datos, `autor-${i}-autorizado`) === "si",
    });
  }

  return lista;
}

function leerFormulario(datos: FormData): ProjectInput {
  return {
    title: texto(datos, "titulo"),
    summary: texto(datos, "resumen"),
    area: texto(datos, "area"),
    gradeLevel: numero(datos, "grado"),
    year: numero(datos, "anio"),
    authors: autores(datos),
  };
}

export async function crearProyecto(
  _anterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await actorActual();
  const resultado = await createProject(leerFormulario(datos), actor);

  if (!resultado.ok) {
    return { errores: resultado.reasons.map((r) => VALIDATION_MESSAGES[r]) };
  }

  revalidatePath("/panel/proyectos");
  redirect(`/panel/proyectos/${resultado.id}`);
}

export async function actualizarProyecto(
  id: string,
  _anterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await actorActual();
  const resultado = await updateProject(id, leerFormulario(datos), actor);

  if (!resultado.ok) {
    return {
      errores:
        "reasons" in resultado
          ? resultado.reasons.map((r) => VALIDATION_MESSAGES[r])
          : ["No encontramos ese proyecto."],
    };
  }

  revalidatePath("/panel/proyectos");
  revalidatePath("/");
  return {};
}

const MOTIVOS_ESTADO: Record<string, string> = {
  NOT_FOUND: "No encontramos ese proyecto.",
  INVALID_TRANSITION: "Ese cambio de estado no está permitido.",
  NOT_ALLOWED: "Solo un administrador puede hacer ese cambio.",
};

export async function cambiarEstado(
  _anterior: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actor = await actorActual();
  const id = texto(datos, "id");
  const siguiente = texto(datos, "siguiente") as ProjectStatus;

  const resultado = await changeStatus(id, siguiente, actor);

  if (!resultado.ok) {
    return { errores: [MOTIVOS_ESTADO[resultado.reason] ?? "No se pudo."] };
  }

  revalidatePath("/panel/proyectos");
  revalidatePath(`/panel/proyectos/${id}`);
  revalidatePath("/");
  revalidatePath("/proyectos");
  return {};
}
