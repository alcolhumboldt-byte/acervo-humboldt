import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  approveRequest,
  listApprovedRequests,
  listPendingRequests,
  reissueToken,
  redeemToken,
  rejectRequest,
  VIGENCIA_DIAS,
} from "@/modules/access/approvals";

async function limpiar() {
  await prisma.documentRequest.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
}

async function escenario() {
  const admin = await prisma.user.create({
    data: {
      email: "admin@acervo.test",
      name: "Administración",
      passwordHash: "hash",
      role: "ADMIN",
    },
  });

  const proyecto = await prisma.project.create({
    data: {
      slug: "la-huerta-escolar",
      title: "La huerta escolar",
      summary: "Resumen.",
      area: "Ciencias naturales",
      gradeLevel: 3,
      year: 2026,
      status: "PUBLISHED",
      publishedAt: new Date(),
      documentPath: "proyectos/x/doc.pdf",
    },
  });

  const solicitud = await prisma.documentRequest.create({
    data: {
      projectId: proyecto.id,
      requesterName: "Marta Villamizar",
      requesterEmail: "marta@ejemplo.com",
      reason: "Quiero citar este trabajo en una ponencia académica.",
    },
  });

  return {
    actor: { id: admin.id, role: "ADMIN" as const },
    docente: { id: admin.id, role: "DOCENTE" as const },
    proyecto,
    solicitud,
  };
}

beforeEach(limpiar);
afterEach(limpiar);

describe("listPendingRequests", () => {
  it("devuelve las que están en espera con su proyecto", async () => {
    await escenario();

    const pendientes = await listPendingRequests();

    expect(pendientes).toHaveLength(1);
    expect(pendientes[0]?.projectTitle).toBe("La huerta escolar");
    expect(pendientes[0]?.reason).toContain("ponencia");
  });

  it("no incluye las ya decididas", async () => {
    const { actor, solicitud } = await escenario();
    await approveRequest(solicitud.id, actor);

    expect(await listPendingRequests()).toHaveLength(0);
  });
});

describe("approveRequest", () => {
  it("devuelve un enlace que se entrega una sola vez", async () => {
    const { actor, solicitud } = await escenario();

    const r = await approveRequest(solicitud.id, actor);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.token.length).toBeGreaterThan(20);
  });

  it("no guarda el enlace en claro, solo su huella", async () => {
    const { actor, solicitud } = await escenario();

    const r = await approveRequest(solicitud.id, actor);

    const guardada = await prisma.documentRequest.findUnique({
      where: { id: solicitud.id },
    });
    expect(guardada?.tokenHash).not.toBeNull();
    if (r.ok) expect(guardada?.tokenHash).not.toBe(r.token);
  });

  it("marca la solicitud como aprobada y por quién", async () => {
    const { actor, solicitud } = await escenario();

    await approveRequest(solicitud.id, actor);

    const guardada = await prisma.documentRequest.findUnique({
      where: { id: solicitud.id },
    });
    expect(guardada?.status).toBe("APPROVED");
    expect(guardada?.decidedById).toBe(actor.id);
    expect(guardada?.decidedAt).not.toBeNull();
  });

  it("le pone fecha de caducidad", async () => {
    const { actor, solicitud } = await escenario();

    await approveRequest(solicitud.id, actor);

    const guardada = await prisma.documentRequest.findUnique({
      where: { id: solicitud.id },
    });
    const dias =
      (guardada!.tokenExpiresAt!.getTime() - Date.now()) / 86_400_000;
    expect(Math.round(dias)).toBe(VIGENCIA_DIAS);
  });

  it("un docente no puede aprobar", async () => {
    const { docente, solicitud } = await escenario();

    expect(await approveRequest(solicitud.id, docente)).toEqual({
      ok: false,
      reason: "NOT_ALLOWED",
    });
  });

  it("no se puede aprobar dos veces", async () => {
    const { actor, solicitud } = await escenario();
    await approveRequest(solicitud.id, actor);

    expect(await approveRequest(solicitud.id, actor)).toEqual({
      ok: false,
      reason: "ALREADY_DECIDED",
    });
  });
});

describe("rejectRequest", () => {
  it("marca la solicitud como rechazada", async () => {
    const { actor, solicitud } = await escenario();

    const r = await rejectRequest(solicitud.id, actor, "Sin autorización.");

    expect(r.ok).toBe(true);
    const guardada = await prisma.documentRequest.findUnique({
      where: { id: solicitud.id },
    });
    expect(guardada?.status).toBe("REJECTED");
    expect(guardada?.decisionNote).toBe("Sin autorización.");
    expect(guardada?.tokenHash).toBeNull();
  });

  it("un docente no puede rechazar", async () => {
    const { docente, solicitud } = await escenario();

    expect(await rejectRequest(solicitud.id, docente, "")).toEqual({
      ok: false,
      reason: "NOT_ALLOWED",
    });
  });
});

describe("redeemToken", () => {
  it("entrega la ruta del documento la primera vez", async () => {
    const { actor, solicitud } = await escenario();
    const aprobada = await approveRequest(solicitud.id, actor);
    if (!aprobada.ok) throw new Error("no aprobó");

    const r = await redeemToken(aprobada.token);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.documentPath).toBe("proyectos/x/doc.pdf");
  });

  it("no sirve una segunda vez", async () => {
    const { actor, solicitud } = await escenario();
    const aprobada = await approveRequest(solicitud.id, actor);
    if (!aprobada.ok) throw new Error("no aprobó");
    await redeemToken(aprobada.token);

    expect(await redeemToken(aprobada.token)).toEqual({
      ok: false,
      reason: "ALREADY_USED",
    });
  });

  it("dos usos simultáneos solo dejan pasar a uno", async () => {
    // Sin una marca atómica, dos clics a la vez entregarían el documento dos
    // veces y el enlace de «un solo uso» no lo sería.
    const { actor, solicitud } = await escenario();
    const aprobada = await approveRequest(solicitud.id, actor);
    if (!aprobada.ok) throw new Error("no aprobó");

    const resultados = await Promise.all([
      redeemToken(aprobada.token),
      redeemToken(aprobada.token),
    ]);

    expect(resultados.filter((r) => r.ok)).toHaveLength(1);
  });

  it("no sirve pasada la fecha de caducidad", async () => {
    const { actor, solicitud } = await escenario();
    const aprobada = await approveRequest(solicitud.id, actor);
    if (!aprobada.ok) throw new Error("no aprobó");
    await prisma.documentRequest.update({
      where: { id: solicitud.id },
      data: { tokenExpiresAt: new Date(Date.now() - 1000) },
    });

    expect(await redeemToken(aprobada.token)).toEqual({
      ok: false,
      reason: "EXPIRED",
    });
  });

  it("rechaza un enlace inventado", async () => {
    await escenario();

    expect(await redeemToken("inventado")).toEqual({
      ok: false,
      reason: "NOT_FOUND",
    });
  });

  it("deja constancia de la entrega", async () => {
    const { actor, solicitud } = await escenario();
    const aprobada = await approveRequest(solicitud.id, actor);
    if (!aprobada.ok) throw new Error("no aprobó");

    await redeemToken(aprobada.token);

    const registro = await prisma.auditLog.findFirst({
      where: { action: "DOCUMENT_DELIVERED" },
    });
    expect(registro).not.toBeNull();
  });
});

describe("reissueToken", () => {
  it("emite un enlace distinto al anterior", async () => {
    const { actor, solicitud } = await escenario();
    const primero = await approveRequest(solicitud.id, actor);
    if (!primero.ok) throw new Error("no aprobó");

    const segundo = await reissueToken(solicitud.id, actor);

    expect(segundo.ok).toBe(true);
    if (segundo.ok) expect(segundo.token).not.toBe(primero.token);
  });

  it("deja sin efecto el enlace anterior", async () => {
    const { actor, solicitud } = await escenario();
    const primero = await approveRequest(solicitud.id, actor);
    if (!primero.ok) throw new Error("no aprobó");
    await reissueToken(solicitud.id, actor);

    expect(await redeemToken(primero.token)).toEqual({
      ok: false,
      reason: "NOT_FOUND",
    });
  });

  it("el enlace nuevo sí funciona", async () => {
    const { actor, solicitud } = await escenario();
    await approveRequest(solicitud.id, actor);
    const segundo = await reissueToken(solicitud.id, actor);
    if (!segundo.ok) throw new Error("no reemitió");

    expect((await redeemToken(segundo.token)).ok).toBe(true);
  });

  it("devuelve a servir aunque el anterior ya se hubiera usado", async () => {
    // Si alguien lo usó por error, o se le interrumpió la descarga, el
    // administrador puede volver a habilitarlo sin rehacer la solicitud.
    const { actor, solicitud } = await escenario();
    const primero = await approveRequest(solicitud.id, actor);
    if (!primero.ok) throw new Error("no aprobó");
    await redeemToken(primero.token);

    const segundo = await reissueToken(solicitud.id, actor);
    if (!segundo.ok) throw new Error("no reemitió");

    expect((await redeemToken(segundo.token)).ok).toBe(true);
  });

  it("un docente no puede reemitir", async () => {
    const { actor, docente, solicitud } = await escenario();
    await approveRequest(solicitud.id, actor);

    expect(await reissueToken(solicitud.id, docente)).toEqual({
      ok: false,
      reason: "NOT_ALLOWED",
    });
  });

  it("no se puede reemitir sobre una solicitud sin aprobar", async () => {
    const { actor, solicitud } = await escenario();

    expect(await reissueToken(solicitud.id, actor)).toEqual({
      ok: false,
      reason: "ALREADY_DECIDED",
    });
  });
});

describe("listApprovedRequests", () => {
  it("muestra las aprobadas con el estado de su enlace", async () => {
    const { actor, solicitud } = await escenario();
    await approveRequest(solicitud.id, actor);

    const [aprobada] = await listApprovedRequests();

    expect(aprobada?.projectTitle).toBe("La huerta escolar");
    expect(aprobada?.usado).toBe(false);
    expect(aprobada?.caducado).toBe(false);
  });

  it("marca como usado el enlace ya canjeado", async () => {
    const { actor, solicitud } = await escenario();
    const r = await approveRequest(solicitud.id, actor);
    if (!r.ok) throw new Error("no aprobó");
    await redeemToken(r.token);

    const [aprobada] = await listApprovedRequests();

    expect(aprobada?.usado).toBe(true);
  });
});
