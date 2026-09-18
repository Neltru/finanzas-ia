import { db } from "@/server/db";
import { differenceInDays, subMonths } from "date-fns";

export interface Subscription {
  merchant: string;
  categoryName: string | null;
  montoPromedio: number;
  intervaloDias: number;
  cadencia: string;
  ocurrencias: number;
  ultimoCargo: Date;
  proximoEstimado: Date;
  costoAnual: number;
}

function describirCadencia(dias: number): string {
  if (dias >= 6 && dias <= 8) return "semanal";
  if (dias >= 13 && dias <= 16) return "quincenal";
  if (dias >= 28 && dias <= 32) return "mensual";
  if (dias >= 58 && dias <= 64) return "bimestral";
  return `cada ${dias} días`;
}

export async function detectSubscriptions(): Promise<Subscription[]> {
  const desde = subMonths(new Date(), 6);

  const txs = await db.transaction.findMany({
    where: { date: { gte: desde }, amount: { gt: 0 } },
    include: { category: { select: { name: true } } },
    orderBy: { date: "asc" },
  });

  // Agrupar por descripción normalizada
  const grupos = new Map<string, typeof txs>();
  for (const t of txs) {
    const key = t.normalizedDescription;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(t);
  }

  const subs: Subscription[] = [];

  for (const [merchant, lista] of grupos) {
    if (lista.length < 3) continue; // se necesitan 3+ para hablar de patrón

    // Intervalos entre cargos consecutivos
    const intervalos: number[] = [];
    for (let i = 1; i < lista.length; i++) {
      intervalos.push(differenceInDays(lista[i].date, lista[i - 1].date));
    }

    const intervaloPromedio =
      intervalos.reduce((a, b) => a + b, 0) / intervalos.length;

    // ¿Los intervalos son consistentes? (desviación estándar baja)
    const varianza =
      intervalos.reduce((s, i) => s + (i - intervaloPromedio) ** 2, 0) /
      intervalos.length;
    const desviacion = Math.sqrt(varianza);

    // Filtro 1: cadencia regular. Tolerancia de ±5 días.
    if (desviacion > 5) continue;

    // Filtro 2: solo cadencias plausibles (semanal, quincenal, mensual, bimestral)
    if (intervaloPromedio < 6 || intervaloPromedio > 70) continue;

    // Filtro 3: montos consistentes (variación < 20% del promedio)
    const montos = lista.map((t) => Number(t.amount));
    const montoPromedio = montos.reduce((a, b) => a + b, 0) / montos.length;
    const varMonto =
      montos.reduce((s, m) => s + Math.abs(m - montoPromedio), 0) /
      montos.length /
      montoPromedio;

    if (varMonto > 0.2) continue;

    const ultimo = lista[lista.length - 1];
    const proximo = new Date(ultimo.date);
    proximo.setDate(proximo.getDate() + Math.round(intervaloPromedio));

    // Si el estimado ya pasó, avanzar hasta la próxima fecha futura
    const hoy = new Date();
    while (proximo < hoy) {
    proximo.setDate(proximo.getDate() + Math.round(intervaloPromedio));
    }

    subs.push({
      merchant,
      categoryName: ultimo.category?.name ?? null,
      montoPromedio,
      intervaloDias: Math.round(intervaloPromedio),
      cadencia: describirCadencia(Math.round(intervaloPromedio)),
      ocurrencias: lista.length,
      ultimoCargo: ultimo.date,
      proximoEstimado: proximo,
      costoAnual: montoPromedio * (365 / intervaloPromedio),
    });
    
  }

  return subs.sort((a, b) => b.costoAnual - a.costoAnual);
  
}

export interface Anomaly {
  transactionId: string;
  merchant: string;
  monto: number;
  fecha: Date;
  categoryName: string | null;
  promedioCategoria: number;
  vecesPromedio: number;
}

export async function detectAnomalies(): Promise<Anomaly[]> {
  const desde = subMonths(new Date(), 6);

  const txs = await db.transaction.findMany({
    where: { date: { gte: desde }, amount: { gt: 0 } },
    include: { category: { select: { name: true } } },
  });

  // Promedio y desviación por categoría
  const porCategoria = new Map<string, number[]>();
  for (const t of txs) {
    const cat = t.category?.name ?? "Sin clasificar";
    if (!porCategoria.has(cat)) porCategoria.set(cat, []);
    porCategoria.get(cat)!.push(Number(t.amount));
  }

  const stats = new Map<string, { media: number; desviacion: number }>();
  for (const [cat, montos] of porCategoria) {
    if (montos.length < 5) continue;
    const media = montos.reduce((a, b) => a + b, 0) / montos.length;
    const varianza =
      montos.reduce((s, m) => s + (m - media) ** 2, 0) / montos.length;
    stats.set(cat, { media, desviacion: Math.sqrt(varianza) });
  }

  const anomalias: Anomaly[] = [];

  for (const t of txs) {
    const cat = t.category?.name ?? "Sin clasificar";
    const s = stats.get(cat);
    if (!s || s.desviacion === 0) continue;

    const monto = Number(t.amount);
    const zScore = (monto - s.media) / s.desviacion;

    // 2.5 desviaciones por encima = inusual
    if (zScore > 2.0) {
      anomalias.push({
        transactionId: t.id,
        merchant: t.merchantName ?? t.rawDescription,
        monto,
        fecha: t.date,
        categoryName: t.category?.name ?? null,
        promedioCategoria: s.media,
        vecesPromedio: monto / s.media,
      });
    }
  }

  return anomalias.sort((a, b) => b.monto - a.monto).slice(0, 10);
}