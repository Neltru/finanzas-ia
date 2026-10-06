import { endOfDay, startOfDay, startOfYear, subDays } from "date-fns";

export type DateRangePreset = "7d" | "30d" | "90d" | "12m" | "ytd";

export const PRESETS: { value: DateRangePreset; label: string; descripcion: string }[] = [
  { value: "7d", label: "7 días", descripcion: "Últimos 7 días" },
  { value: "30d", label: "30 días", descripcion: "Últimos 30 días" },
  { value: "90d", label: "90 días", descripcion: "Últimos 90 días" },
  { value: "12m", label: "12 meses", descripcion: "Últimos 12 meses" },
  { value: "ytd", label: "Año actual", descripcion: "En lo que va del año" },
];

export function parsePreset(value?: string | null): DateRangePreset {
  return PRESETS.some((p) => p.value === value) ? (value as DateRangePreset) : "30d";
}

/**
 * Límites redondeados al día: así el rango no cambia en cada render y no
 * invalida la query key de React Query en cada pintado.
 */
export function resolveRange(preset?: string | null): { from: Date; to: Date } {
  const hoy = new Date();
  const to = endOfDay(hoy);

  switch (parsePreset(preset)) {
    case "7d":  return { from: startOfDay(subDays(hoy, 7)), to };
    case "90d": return { from: startOfDay(subDays(hoy, 90)), to };
    case "12m": return { from: startOfDay(subDays(hoy, 365)), to };
    case "ytd": return { from: startOfYear(hoy), to };
    case "30d":
    default:    return { from: startOfDay(subDays(hoy, 30)), to };
  }
}
