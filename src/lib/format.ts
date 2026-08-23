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

export function normalizeDescription(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\d{4,}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}