import { db } from "../../../server/db";
import { startOfMonth, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import { SpendingTrend } from "../../../components/charts/spending-trend";
import { Amount } from "../../../components/shared/amount";
import { resolveRange } from "@/lib/date-range";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const { from, to } = resolveRange(searchParams.range);
  const now = new Date();

  const transactions = await db.transaction.findMany({
    where: { date: { gte: from, lte: to } },
    include: { category: true },
  });

  const gastos = transactions
    .filter((t) => Number(t.amount) > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const ingresos = transactions
    .filter((t) => Number(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const porCategoria = new Map<string, number>();
  for (const t of transactions) {
    if (Number(t.amount) <= 0) continue;
    const nombre = t.category?.name ?? "Sin clasificar";
    porCategoria.set(nombre, (porCategoria.get(nombre) ?? 0) + Number(t.amount));
  }

  const topCategorias = [...porCategoria.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
    const seisMesesAtras = startOfMonth(subMonths(now, 5));
    const historico = await db.transaction.findMany({
    where: { date: { gte: seisMesesAtras } },
    select: { date: true, amount: true },
    orderBy: { date: "asc" },
    });

    const porMes = new Map<string, { Gastos: number; Ingresos: number }>();
    for (const t of historico) {
    const clave = format(t.date, "MMM yy", { locale: es });
    const actual = porMes.get(clave) ?? { Gastos: 0, Ingresos: 0 };
    const monto = Number(t.amount);
    if (monto > 0) actual.Gastos += monto;
    else actual.Ingresos += Math.abs(monto);
    porMes.set(clave, actual);
    }

    const tendencia = [...porMes.entries()].map(([mes, v]) => ({ mes, ...v }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Resumen del mes</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Ingresos</p>
          <Amount
            value={ingresos}
            className="mt-1 block text-2xl font-semibold text-emerald-600"
          />
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Gastos</p>
          <Amount
            value={gastos}
            className="mt-1 block text-2xl font-semibold text-red-600"
          />
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Balance</p>
          <Amount
            value={ingresos - gastos}
            className="mt-1 block text-2xl font-semibold"
          />
        </div>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-medium">Ingresos vs gastos (6 meses)</h2>
            <SpendingTrend data={tendencia} />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-medium">Top categorías de gasto</h2>
        <ul className="space-y-2">
          {topCategorias.map(([nombre, monto]) => (
            <li key={nombre} className="flex justify-between text-sm">
              <span className="text-neutral-600">{nombre}</span>
              <Amount value={monto} className="font-medium" />
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-neutral-500">
        {transactions.length} transacciones este mes
      </p>
    </div>
  );
}