"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { PRESETS } from "@/lib/date-range";
import { useDashboardFilters } from "@/lib/use-dashboard-filters";

export function FilterBar() {
  const { preset, accountId, setPreset, setAccountId } = useDashboardFilters();
  const trpc = useTRPC();
  const { data: accounts } = useQuery(trpc.account.list.queryOptions());

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <select
        data-tour="account-filter"
        value={accountId ?? "all"}
        onChange={(e) => setAccountId(e.target.value === "all" ? null : e.target.value)}
        aria-label="Cuenta"
        className="min-w-0 max-w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm"
      >
        <option value="all">Todas las cuentas</option>
        {accounts?.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ••{a.mask}
          </option>
        ))}
      </select>

      <div data-tour="date-filter" className="flex items-center gap-1 rounded-md border border-neutral-200 p-1">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium transition-colors sm:px-2.5 ${
              preset === p.value
                ? "bg-emerald-500 text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
