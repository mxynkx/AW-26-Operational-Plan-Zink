const CRORE = 10_000_000; // 1,00,00,000
const LAKH = 100_000; // 1,00,000

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= CRORE) {
    return `${sign}₹${(abs / CRORE).toFixed(2)} Cr`;
  }

  if (abs >= LAKH) {
    return `${sign}₹${(abs / LAKH).toFixed(2)} L`;
  }

  if (abs >= 1_000) {
    return `${sign}₹${formatNumber(abs)}`;
  }

  return formatCurrency(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
