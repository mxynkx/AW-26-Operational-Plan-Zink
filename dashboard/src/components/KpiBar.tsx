import { formatCompactCurrency, formatNumber, formatPercent } from "../utils/format";

interface KpiBarProps {
  target: number;
  sales: number;
  soh: number;
  sellThrough: number;
}

export function KpiBar({ target, sales, soh, sellThrough }: KpiBarProps) {
  const cards = [
    { label: "Total Target (₹)", value: formatCompactCurrency(target) },
    { label: "Total Sales Units", value: formatNumber(sales) },
    { label: "Total SOH Units", value: formatNumber(soh) },
    { label: "Avg. Sell Through %", value: formatPercent(sellThrough) },
  ];

  return (
    <div className="bg-surface-bright border-b border-surface-border px-margin-edge py-4 shrink-0">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-[1440px]">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-surface-container-lowest border border-surface-border rounded-xl p-4 shadow-sm"
          >
            <p className="text-label-caps text-secondary mb-1 uppercase">{card.label}</p>
            <p className="text-headline-md font-bold text-primary">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
