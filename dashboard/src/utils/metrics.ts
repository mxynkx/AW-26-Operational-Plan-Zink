import type { TableRow } from "../types/plan";

/** Target is defined once per store + month (not per category row). */
export function storeMonthKey(row: TableRow): string {
  return `${row.Site_Code}|${row.Month ?? ""}`;
}

export function sumTargetDeduplicated(rows: TableRow[]): number {
  const byStoreMonth = new Map<string, number>();
  for (const row of rows) {
    const key = storeMonthKey(row);
    if (!byStoreMonth.has(key)) {
      byStoreMonth.set(key, row.Target);
    }
  }
  return Array.from(byStoreMonth.values()).reduce((sum, value) => sum + value, 0);
}

export function computeSellThroughPercent(sales: number, soh: number): number {
  if (soh <= 0) {
    return 0;
  }
  return (sales / soh) * 100;
}

export function computeKpis(rows: TableRow[]) {
  const target = sumTargetDeduplicated(rows);
  const sales = rows.reduce((sum, row) => sum + row.Sales_Units, 0);
  const soh = rows.reduce((sum, row) => sum + row.Total_SOH_Units, 0);
  const sellThrough = computeSellThroughPercent(sales, soh);

  return { target, sales, soh, sellThrough };
}

export function aggregateRowMetrics(rows: TableRow[]) {
  const sales = rows.reduce((sum, row) => sum + row.Sales_Units, 0);
  const soh = rows.reduce((sum, row) => sum + row.Total_SOH_Units, 0);
  const target = sumTargetDeduplicated(rows);
  return {
    sales,
    soh,
    target,
    sellThrough: computeSellThroughPercent(sales, soh),
  };
}
