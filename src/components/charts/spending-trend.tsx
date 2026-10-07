"use client";

import { AreaChart } from "@tremor/react";
import { useFiltersStore } from "../../stores/filters.store";
import { CHART_Y_AXIS_WIDTH, formatChartMoney } from "@/lib/format";

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
      valueFormatter={(v) => formatChartMoney(v, privacyMode)}
      yAxisWidth={CHART_Y_AXIS_WIDTH}
      className="h-72"
    />
  );
}
