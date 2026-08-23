"use client";

import { AreaChart } from "@tremor/react";
import { useFiltersStore } from "../../stores/filters.store";

interface Point {
  mes: string;
  Gastos: number;
  Ingresos: number;
}

export function SpendingTrend({ data }: { data: Point[] }) {
  const privacyMode = useFiltersStore((s) => s.privacyMode);

  return (
    <AreaChart
      data={data}
      index="mes"
      categories={["Ingresos", "Gastos"]}
      colors={["emerald", "red"]}
      valueFormatter={(v) =>
        privacyMode
          ? "••••"
          : `$${v.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`
      }
      className="h-72"
    />
  );
}