import { startOfYear, subDays } from "date-fns";

export function resolveRange(preset?: string): { from: Date; to: Date } {
  const to = new Date();

  switch (preset) {
    case "7d":  return { from: subDays(to, 7), to };
    case "90d": return { from: subDays(to, 90), to };
    case "12m": return { from: subDays(to, 365), to };
    case "ytd": return { from: startOfYear(to), to };
    case "30d":
    default:    return { from: subDays(to, 30), to };
  }
}