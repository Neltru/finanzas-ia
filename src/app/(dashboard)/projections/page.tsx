"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart } from "@tremor/react";
import { useTRPC } from "@/lib/trpc";
import { useFiltersStore } from "@/stores/filters.store";
import { Amount } from "@/components/shared/amount";

export default function ProjectionsPage() {
  const trpc = useTRPC();
  const privacyMode = useFiltersStore((s) => s.privacyMode);
  const selectedAccountId = useFiltersStore((s) => s.selectedAccountId);
  const [meses, setMeses] = useState(6);

  const { data, isLoading } = useQuery(
    trpc.projection.balance.queryOptions({
      months: meses,
      accountId: selectedAccountId ?? undefined,
    })
  );

  const chartData = data?.puntos.map((p) => ({
    mes: p.mes,
    Histórico: p.balance,
    Proyección: p.proyeccion,
  }));

  const balanceFinal = data?.puntos.at(-1)?.proyeccion ?? 0;
  const cambio = balanceFinal - (data?.balanceActual ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proyecciones</h1>
        <div className="flex gap-1 rounded-md border border-neutral-200 p-1">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setMeses(m)}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                meses === m
                  ? "bg-emerald-500 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {m} meses
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-80 animate-pulse rounded-lg bg-neutral-200" />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Metric label="Balance actual" value={data!.balanceActual} />
            <Metric
              label="Ingreso mensual"
              value={data!.ingresoMensualPromedio}
              className="text-emerald-600"
            />
            <Metric
              label="Gasto mensual"
              value={data!.gastoMensualPromedio}
              className="text-red-600"
            />
            <Metric
              label="Flujo neto"
              value={data!.flujoNetoMensual}
              className={data!.flujoNetoMensual >= 0 ? "text-emerald-600" : "text-red-600"}
            />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-medium">Balance proyectado</h2>
              <span className="text-sm text-neutral-500">
                en {meses} meses:{" "}
                <Amount
                  value={balanceFinal}
                  className={`font-medium ${cambio >= 0 ? "text-emerald-600" : "text-red-600"}`}
                />
              </span>
            </div>

            <LineChart
              data={chartData ?? []}
              index="mes"
              categories={["Histórico", "Proyección"]}
              colors={["blue", "emerald"]}
              connectNulls={false}
              valueFormatter={(v) =>
                privacyMode
                  ? "••••"
                  : `$${v.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`
              }
              className="h-72"
            />

            <p className="mt-3 text-xs text-neutral-400">
              Proyección lineal basada en el flujo neto promedio de los últimos meses
              completos. No modela estacionalidad ni cambios de ingreso.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-2 font-medium">Gastos comprometidos</h2>
            <p className="text-sm text-neutral-600">
              <Amount
                value={data!.gastosFijosMensuales}
                className="font-semibold"
              />{" "}
              al mes son cargos recurrentes detectados — un{" "}
              <span className="font-medium">
                {((data!.gastosFijosMensuales / data!.gastoMensualPromedio) * 100).toFixed(0)}%
              </span>{" "}
              de tu gasto mensual promedio.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) 
{
  
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <Amount value={value} className={`mt-1 block text-xl font-semibold ${className}`} />
    </div>
  );
}