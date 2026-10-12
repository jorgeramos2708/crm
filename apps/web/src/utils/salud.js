// Salud de tratos por inactividad (días sin movimiento = updatedAt).
// Espejo backend: worker (loop de alertas) usa los mismos umbrales.
// Categorías: temprana 3d (Prospección, Calificación), media 7d
// (Reunión/Demostración, Propuesta), tardía 15d (Negociación, Postventa).
// Finales (Ganado/Perdido) exentas.
export const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const CATEGORIA_UMBRAL = [
  { dias: 3, nombres: ["prospeccion", "calificacion"] },
  {
    dias: 7,
    nombres: [
      "reunion",
      "reunion/demostracion",
      "demostracion",
      "demo",
      "propuesta",
    ],
  },
  { dias: 15, nombres: ["negociacion", "postventa", "post-venta"] },
];

const FINALES = ["ganado", "won", "closed", "perdido", "lost", "perdida"];

export function categoriaEtapa(nombre) {
  const n = norm(nombre);
  if (FINALES.includes(n)) return { categoria: "final", umbral: Infinity };
  for (const c of CATEGORIA_UMBRAL) {
    if (c.nombres.includes(n)) return { categoria: "media", umbral: c.dias };
  }
  return { categoria: "media", umbral: 7 };
}

export function diasQuieto(updatedAt) {
  if (!updatedAt) return 0;
  const ms = Date.now() - new Date(updatedAt).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

// Nivel: ok (verde) | alerta (amarillo) | riesgo (rojo).
// Alerta desde el umbral; riesgo desde el doble.
export function saludOportunidad(opp, nombreEtapa) {
  const { umbral } = categoriaEtapa(nombreEtapa);
  if (!isFinite(umbral))
    return { nivel: "ok", dias: diasQuieto(opp?.updatedAt) };
  const dias = diasQuieto(opp?.updatedAt);
  if (dias >= umbral * 2) return { nivel: "riesgo", dias };
  if (dias >= umbral) return { nivel: "alerta", dias };
  return { nivel: "ok", dias };
}

export const SALUD_ESTILO = {
  ok: "bg-green-500",
  alerta: "bg-amber-500",
  riesgo: "bg-red-500",
};
