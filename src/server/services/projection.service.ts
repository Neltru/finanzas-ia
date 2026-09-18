import { db } from "@/server/db";
import { subMonths, startOfMonth, addMonths, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { detectSubscriptions } from "./insights.service";
import { fromDbDate } from "@/lib/format";

export interface ProjectionPoint {
  mes: string;
  balance: number | null;      // histórico real
  proyeccion: number | null;   // estimado
  esProyeccion: boolean;
}

export interface ProjectionResult {
  puntos: ProjectionPoint[];
  balanceActual: number;
  ingresoMensualPromedio: number;
  gastoMensualPromedio: number;
  flujoNetoMensual: number;
  gastosFijosMensuales: number;
}

export async function projectBalance(
  mesesAdelante = 6,
  accountId?: string
): Promise<ProjectionResult> {
  const hoy = new Date();
  const desde = startOfMonth(subMonths(hoy, 6));

  const accounts = await db.account.findMany({
    where: accountId ? { id: accountId } : undefined,
    select: { currentBalance: true },
  });
  const balanceActual = accounts.reduce((s, a) => s + Number(a.currentBalance), 0);

  const txs = await db.transaction.findMany({
    where: { date: { gte: desde }, ...(accountId && { accountId }) },
    select: { date: true, amount: true },
    orderBy: { date: "asc" },
  });

  // Agregar por mes
  const porMes = new Map<string, { ingresos: number; gastos: number }>();
  for (const t of txs) {
    const clave = format(startOfMonth(fromDbDate(t.date)), "yyyy-MM");
    const actual = porMes.get(clave) ?? { ingresos: 0, gastos: 0 };
    const monto = Number(t.amount);
    if (monto > 0) actual.gastos += monto;
    else actual.ingresos += Math.abs(monto);
    porMes.set(clave, actual);
  }

  // Descartar el mes en curso: está incompleto y sesgaría el promedio a la baja
  const mesActual = format(startOfMonth(hoy), "yyyy-MM");
  const mesesCompletos = [...porMes.entries()].filter(([k]) => k !== mesActual);

  const n = mesesCompletos.length || 1;
  const ingresoMensualPromedio =
    mesesCompletos.reduce((s, [, v]) => s + v.ingresos, 0) / n;
  const gastoMensualPromedio =
    mesesCompletos.reduce((s, [, v]) => s + v.gastos, 0) / n;
  const flujoNetoMensual = ingresoMensualPromedio - gastoMensualPromedio;

  // Cuánto del gasto es comprometido (suscripciones detectadas)
  const subs = await detectSubscriptions();
  const gastosFijosMensuales = subs.reduce(
    (s, x) => s + x.montoPromedio * (30 / x.intervaloDias),
    0
  );

  // Serie histórica: reconstruir balance hacia atrás desde el actual
  const puntos: ProjectionPoint[] = [];
  const historico = [...porMes.entries()].sort();

  let balance = balanceActual;
  const balancesPasados: [string, number][] = [];
  for (let i = historico.length - 1; i >= 0; i--) {
    const [clave, v] = historico[i];
    balancesPasados.unshift([clave, balance]);
    balance -= v.ingresos - v.gastos; // deshacer el flujo de ese mes
  }

  for (const [clave, bal] of balancesPasados) {
    puntos.push({
      mes: format(parseISO(clave + "-01"), "MMM yy", { locale: es }),
      balance: Math.round(bal),
      proyeccion: null,
      esProyeccion: false,
    });
  }

  // Empalmar: el último punto histórico también ancla la proyección
  if (puntos.length > 0) {
    puntos[puntos.length - 1].proyeccion = puntos[puntos.length - 1].balance;
  }

  // Proyección hacia adelante
  // Anclar al último mes con datos: si el histórico termina antes del mes en
  // curso, arrancar desde hoy deja un hueco en el eje X.
  const ultimaClave =
    historico.length > 0
      ? historico[historico.length - 1][0]
      : format(startOfMonth(hoy), "yyyy-MM");
  const anclaMes = parseISO(ultimaClave + "-01");

  let proyectado = balanceActual;
  for (let i = 1; i <= mesesAdelante; i++) {
    proyectado += flujoNetoMensual;
    puntos.push({
      mes: format(addMonths(anclaMes, i), "MMM yy", { locale: es }),
      balance: null,
      proyeccion: Math.round(proyectado),
      esProyeccion: true,
    });
  }

  return {
    puntos,
    balanceActual,
    ingresoMensualPromedio,
    gastoMensualPromedio,
    flujoNetoMensual,
    gastosFijosMensuales,
  };
}