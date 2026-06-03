import { aggregateRowMetrics, storeMonthKey } from "./metrics";
import { dimKey, dimLabel, sortDimKeys, DIM_LABELS } from "./dimensions";
import type { TableRow } from "../types/plan";
import type { DimKey, PivotExplorerConfig } from "../types/planFilters";

export type PivotMetricKey = "sales" | "soh" | "target" | "sellThrough";

export interface PivotMetric {
  key: PivotMetricKey;
  label: string;
  css: string;
}

export interface PivotExplorerCell {
  sales: number;
  soh: number;
  target: number;
}

function emptyPivotCell(): PivotExplorerCell {
  return { sales: 0, soh: 0, target: 0 };
}

function addRow(cell: PivotExplorerCell, row: TableRow): void {
  cell.sales += row.Sales_Units;
  cell.soh += row.Total_SOH_Units;
  const sm = storeMonthKey(row);
  const seen = (cell as PivotExplorerCell & { _seen?: Set<string> })._seen ?? new Set<string>();
  if (!seen.has(sm)) {
    seen.add(sm);
    cell.target += row.Target;
  }
  (cell as PivotExplorerCell & { _seen?: Set<string> })._seen = seen;
}

function sellThrough(cell: PivotExplorerCell): number {
  return cell.soh > 0 ? cell.sales / cell.soh : 0;
}

function tripleKey(k1: string | number, k2: string | number, kc: string | number): string {
  return `${k1}\0${k2}\0${kc}`;
}

export interface PivotExplorerResult {
  metrics: PivotMetric[];
  row1Keys: (string | number)[];
  row2Keys: (string | number)[];
  colKeys: (string | number)[];
  hasRow2: boolean;
  hasCol: boolean;
  getCell: (k1: string | number, k2: string | number, kc: string | number) => PivotExplorerCell;
  grand: PivotExplorerCell & { st: number };
  colGrand: Map<string | number, PivotExplorerCell & { st: number }>;
  row1Label: string;
  row2Label: string;
  info: string;
}

export function buildPivotExplorer(
  rows: TableRow[],
  config: PivotExplorerConfig,
): PivotExplorerResult | null {
  const metrics: PivotMetric[] = [];
  if (config.showSales) metrics.push({ key: "sales", label: "Sales", css: "sa" });
  if (config.showSoh) metrics.push({ key: "soh", label: "SOH", css: "so" });
  if (config.showTarget) metrics.push({ key: "target", label: "Target", css: "tg" });
  if (config.showSellThrough) metrics.push({ key: "sellThrough", label: "ST%", css: "st" });

  if (metrics.length === 0) {
    return null;
  }

  const { row1, row2, col } = config;
  const hasRow2 = row2 !== "none";
  const hasCol = col !== "none";
  const map = new Map<string, PivotExplorerCell>();
  const r1Set = new Set<string | number>();
  const r2Set = new Set<string | number>();
  const cSet = new Set<string | number>();

  for (const row of rows) {
    const k1 = dimKey(row, row1);
    const k2 = hasRow2 ? dimKey(row, row2) : "__";
    const kc = hasCol ? dimKey(row, col) : "__";
    r1Set.add(k1);
    r2Set.add(k2);
    cSet.add(kc);
    const key = tripleKey(k1, k2, kc);
    let cell = map.get(key);
    if (!cell) {
      cell = emptyPivotCell();
      map.set(key, cell);
    }
    addRow(cell, row);
  }

  const row1Keys = sortDimKeys([...r1Set], row1);
  const row2Keys = hasRow2 ? sortDimKeys([...r2Set], row2) : ["__"];
  const colKeys = hasCol ? sortDimKeys([...cSet], col) : ["__"];

  const getCell = (k1: string | number, k2: string | number, kc: string | number) =>
    map.get(tripleKey(k1, k2, kc)) ?? emptyPivotCell();

  const grandAgg = aggregateRowMetrics(rows);

  const colGrand = new Map<string | number, PivotExplorerCell & { st: number }>();
  for (const kc of colKeys) {
    const subset = hasCol ? rows.filter((r) => dimKey(r, col) === kc) : rows;
    const a = aggregateRowMetrics(subset);
    colGrand.set(kc, {
      sales: a.sales,
      soh: a.soh,
      target: a.target,
      st: a.sellThrough / 100,
    });
  }

  return {
    metrics,
    row1Keys,
    row2Keys,
    colKeys,
    hasRow2,
    hasCol,
    getCell,
    grand: {
      sales: grandAgg.sales,
      soh: grandAgg.soh,
      target: grandAgg.target,
      st: grandAgg.sellThrough / 100,
    },
    colGrand,
    row1Label: DIM_LABELS[row1],
    row2Label: DIM_LABELS[row2],
    info: `${row1Keys.length} groups × ${hasCol ? colKeys.length : 1} cols`,
  };
}

export function rowsForDim(
  rows: TableRow[],
  dim: DimKey,
  key: string | number,
): TableRow[] {
  if (dim === "none") {
    return rows;
  }
  return rows.filter((r) => dimKey(r, dim) === key);
}

export function rowSubtotal(rows: TableRow[], row1: DimKey, k1: string | number): PivotExplorerCell {
  return aggregateRowMetrics(rowsForDim(rows, row1, k1));
}

export { dimLabel, sellThrough };
