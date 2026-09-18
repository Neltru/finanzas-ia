"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useFiltersStore, type DateRangePreset } from "../../stores/filters.store";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "12m", label: "12 meses" },
  { value: "ytd", label: "Año actual" },
];

export function FilterBar() {
  const dateRange = useFiltersStore((s) => s.dateRange);
  const setDateRange = useFiltersStore((s) => s.setDateRange);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const { data: accounts } = useQuery(trpc.account.list.queryOptions());
  const selectedAccountId = useFiltersStore((s) => s.selectedAccountId);
  const setSelectedAccountId = useFiltersStore((s) => s.setSelectedAccountId);

  function handlePreset(preset: DateRangePreset) {
    const to = new Date();
    const from = new Date();

    if (preset === "ytd") {
      from.setMonth(0, 1);
    } else {
      const days: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };
      from.setDate(from.getDate() - days[preset]);
    }

    setDateRange({ from, to, preset });

    // Reflejar en la URL para que los Server Components reaccionen
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", preset);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex w-full items-center justify-between">
      <select
        value={selectedAccountId ?? "all"}
        onChange={(e) =>
          setSelectedAccountId(e.target.value === "all" ? null : e.target.value)
        }
        className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm"
      >
        <option value="all">Todas las cuentas</option>
        {accounts?.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ••{a.mask}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1 rounded-md border border-neutral-200 p-1">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              dateRange.preset === p.value
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