"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parsePreset, resolveRange, type DateRangePreset } from "./date-range";

/**
 * Filtros del dashboard leídos de la URL (?range=30d&account=<id>).
 * La URL es la única fuente de verdad: la leen igual las páginas cliente y
 * los Server Components (overview), y sobrevive a recargas y enlaces.
 */
export function useDashboardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const preset = parsePreset(searchParams.get("range"));
  const accountId = searchParams.get("account");
  const { from, to } = useMemo(() => resolveRange(preset), [preset]);

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return {
    preset,
    accountId,
    from,
    to,
    setPreset: (p: DateRangePreset) => update("range", p),
    setAccountId: (id: string | null) => update("account", id),
  };
}
