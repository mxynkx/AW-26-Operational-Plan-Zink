import { formatCompactCurrency, formatNumber, formatPercent } from "../utils/format";

interface KpiBarProps {
  target: number;
  sales: number;
  soh: number;
  sellThrough: number;
  storeCount?: number;
  monthCount?: number;
  compact?: boolean;
}

const ACCENTS = [
  "from-primary-container to-data-indigo",
  "from-success-emerald to-emerald-600",
  "from-cyan-600 to-cyan-800",
  "from-violet-600 to-violet-800",
];

export function KpiBar({
  target,
  sales,
  soh,
  sellThrough,
  storeCount,
  monthCount,
  compact = false,
}: KpiBarProps) {
  const cards = [
    {
      label: compact ? "Rs. Target" : "Total Rs. Target",
      value: formatCompactCurrency(target),
      sub: "Store-month deduplicated",
      accent: ACCENTS[0],
    },
    {
      label: compact ? "Sales Units" : "Sales Units Plan",
      value: formatNumber(sales),
      sub: storeCount != null ? `${storeCount} stores` : "",
      accent: ACCENTS[1],
    },
    {
      label: compact ? "SOH Units" : "SOH Units Plan",
      value: formatNumber(soh),
      sub: monthCount != null ? `${monthCount} months` : "",
      accent: ACCENTS[2],
    },
    {
      label: "Sell-Through %",
      value: formatPercent(sellThrough),
      sub: "Sales / SOH",
      accent: ACCENTS[3],
    },
  ];

  const grid = compact
    ? "grid grid-cols-2 lg:grid-cols-4 gap-2 px-4 py-2.5"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5";

  return (
    <div className={grid}>
      {cards.map((card) => (
        <div
          key={card.label}
          className="relative bg-surface-container-lowest border-[1.5px] border-surface-border rounded-lg px-4 py-3 shadow-sm overflow-hidden"
        >
          <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${card.accent}`} />
          <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">{card.label}</p>
          <p className={`font-bold text-on-surface leading-none ${compact ? "text-xl" : "text-2xl"}`}>
            {card.value}
          </p>
          {card.sub ? <p className="text-[10.5px] text-secondary mt-1">{card.sub}</p> : null}
        </div>
      ))}
    </div>
  );
}
