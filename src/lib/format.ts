export function formatCurrency(
  amount: number,
  opts: { privacyMode?: boolean; currency?: string } = {}
): string {
  const { privacyMode = false, currency = "MXN" } = opts;

  if (privacyMode) {
    return amount < 0 ? "-••••" : "••••";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Montos para ejes y tooltips de gráficas: sin centavos y con el signo antes
 * del símbolo ("-$23,000"). La plantilla `$${v}` daba "$-23,000".
 */
export function formatChartMoney(v: number, privacyMode = false): string {
  if (privacyMode) return v < 0 ? "-••••" : "••••";
  const abs = Math.abs(v).toLocaleString("es-MX", { maximumFractionDigits: 0 });
  return `${v < 0 ? "-" : ""}$${abs}`;
}

/** Ancho del eje Y para que quepa "-$100,000" sin recortar el signo */
export const CHART_Y_AXIS_WIDTH = 80;

/**
 * Las columnas `@db.Date` de Prisma llegan como medianoche UTC. Formatearlas
 * en una zona con offset negativo muestra el día anterior — y mete el día 1 en
 * el mes previo, rompiendo cualquier agrupación mensual. Esto las reinterpreta
 * como fecha local.
 */
export function fromDbDate(d: Date): Date {
  return new Date(d.getTime() + d.getTimezoneOffset() * 60_000);
}

export function normalizeDescription(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\d{4,}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}