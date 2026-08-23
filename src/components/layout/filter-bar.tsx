"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useFiltersStore, type DateRangePreset } from "../../stores/filters.store";

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
    <div className="flex w-full items-center justify-end">
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