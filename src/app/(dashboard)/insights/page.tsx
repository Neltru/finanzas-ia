"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTRPC } from "@/lib/trpc";
import { Amount } from "@/components/shared/amount";
import { fromDbDate } from "@/lib/format";

export default function InsightsPage() {
  const trpc = useTRPC();

  const subs = useQuery(trpc.insights.subscriptions.queryOptions());
  const anomalias = useQuery(trpc.insights.anomalies.queryOptions());
  const ahorro = useQuery(trpc.insights.aiSavings.queryOptions());

  const costoAnualTotal =
    subs.data?.reduce((s, x) => s + x.costoAnual, 0) ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Insights</h1>

      {/* Suscripciones detectadas */}
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-medium">Suscripciones detectadas</h2>
          {subs.data && subs.data.length > 0 && (
            <span className="text-sm text-neutral-500">
              <Amount value={costoAnualTotal} className="font-medium" /> al año
            </span>
          )}
        </div>

        {subs.isLoading ? (
          <SkeletonRows n={4} />
        ) : subs.data?.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No se detectaron cargos recurrentes en los últimos 6 meses.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {subs.data?.map((s) => (
              <li key={s.merchant} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{s.merchant}</p>
                  <p className="text-xs text-neutral-500">
                    {s.cadencia} · {s.ocurrencias} cargos · próximo{" "}
                    {format(fromDbDate(s.proximoEstimado), "d MMM", { locale: es })}
                  </p>
                </div>
                <div className="text-right">
                  <Amount value={s.montoPromedio} className="block text-sm font-medium" />
                  <span className="text-xs text-neutral-400">
                    <Amount value={s.costoAnual} />/año
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Gastos inusuales */}
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-medium">Gastos inusuales</h2>

        {anomalias.isLoading ? (
          <SkeletonRows n={3} />
        ) : anomalias.data?.length === 0 ? (
          <p className="text-sm text-neutral-500">Nada fuera de lo normal.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {anomalias.data?.map((a) => (
              <li key={a.transactionId} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{a.merchant}</p>
                  <p className="text-xs text-neutral-500">
                    {format(fromDbDate(a.fecha), "d MMM yyyy", { locale: es })} ·{" "}
                    {a.vecesPromedio.toFixed(1)}× el promedio de {a.categoryName}
                  </p>
                </div>
                <Amount value={a.monto} className="text-sm font-medium text-amber-600" />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Eficiencia del pipeline de IA */}
      {ahorro.data && (
        <section className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-2 font-medium">Eficiencia de categorización</h2>
          <p className="text-sm text-neutral-600">
            <span className="font-semibold text-emerald-600">
              {ahorro.data.llamadasAhorradas}
            </span>{" "}
            categorizaciones resueltas desde caché, sin llamar a la IA.{" "}
            {ahorro.data.descripcionesCacheadas} comercios distintos aprendidos.
          </p>
        </section>
      )}
    </div>
  );
}

function SkeletonRows({ n }: { n: number }) {
  return (
    <div className="divide-y divide-neutral-100">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2.5">
          <div className="space-y-1.5">
            <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-48 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}