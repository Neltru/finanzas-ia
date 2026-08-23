
"use client";

import { useFiltersStore } from "../../stores/filters.store";
import { formatCurrency } from "../../lib/format";

export function Amount({ value, className }: { value: number; className?: string }) {
  const privacyMode = useFiltersStore((s) => s.privacyMode);
  return <span className={className}>{formatCurrency(value, { privacyMode })}</span>;
}