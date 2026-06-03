import { aggregateRowMetrics, aggregateRowMetricsForSize, storeMonthKey } from "./metrics";
import { dimKey, dimLabel, isSizeDim, sizeKeyFromPivot, sortDimKeys, DIM_LABELS } from "./dimensions";
import { SIZE_COLUMNS, type SizeColumn, type TableRow } from "../types/plan";
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

function usesSizeDim(config: PivotExplorerConfig): boolean {
  return isSizeDim(config.row1) || isSizeDim(config.row2) || isSizeDim(config.col);
}

function addRow(cell: PivotExplorerCell, row: TableRow, size: SizeColumn | null): void {
  if (size) {
    cell.sales += row.Sales_By_Size[size];
    cell.soh += row.SOH_By_Size[size];
    return;
  }
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

type SizeSlot = SizeColumn | null;

function sizeSlots(dim: DimKey, use: boolean): SizeSlot[] {
  return dim === "sz" && use ? [...SIZE_COLUMNS] : [null];
}

function resolveSliceSize(
  sz1: SizeSlot,
  sz2: SizeSlot,
  szc: SizeSlot,
  config: PivotExplorerConfig,
  hasRow2: boolean,
  hasCol: boolean,
): SizeColumn | null {
  const parts: SizeColumn[] = [];
  if (config.row1 === "sz" && sz1) parts.push(sz1);
  if (hasRow2 && config.row2 === "sz" && sz2) parts.push(sz2);
  if (hasCol && config.col === "sz" && szc) parts.push(szc);
  if (parts.length === 0) return null;
  const first = parts[0];
  return parts.every((p) => p === first) ? first : null;
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

  const slots1 = sizeSlots(row1, true);
  const slots2 = sizeSlots(row2, hasRow2);
  const slotsC = sizeSlots(col, hasCol);
  const includeTarget = !usesSizeDim(config);

  for (const row of rows) {
    for (const sz1 of slots1) {
      for (const sz2 of slots2) {
        for (const szc of slotsC) {
          const size = resolveSliceSize(sz1, sz2, szc, config, hasRow2, hasCol);
          if ((sz1 || sz2 || szc) && !size) continue;

          const k1 = row1 === "sz" ? size! : dimKey(row, row1);
          const k2 = hasRow2 ? (row2 === "sz" ? size! : dimKey(row, row2)) : "__";
          const kc = hasCol ? (col === "sz" ? size! : dimKey(row, col)) : "__";
          r1Set.add(k1);
          r2Set.add(k2);
          cSet.add(kc);
          const key = tripleKey(k1, k2, kc);
          let cell = map.get(key);
          if (!cell) {
            cell = emptyPivotCell();
            map.set(key, cell);
          }
          addRow(cell, row, includeTarget ? null : size);
        }
      }
    }
  }

  const row1Keys = sortDimKeys([...r1Set], row1);
  const row2Keys = hasRow2 ? sortDimKeys([...r2Set], row2) : ["__"];
  const colKeys = hasCol ? sortDimKeys([...cSet], col) : ["__"];

  const getCell = (k1: string | number, k2: string | number, kc: string | number) =>
    map.get(tripleKey(k1, k2, kc)) ?? emptyPivotCell();

  const grandAgg = aggregateRowMetrics(rows);

  const colGrand = new Map<string | number, PivotExplorerCell & { st: number }>();
  for (const kc of colKeys) {
    const subset = hasCol
      ? rows.filter((r) => (col === "sz" ? true : dimKey(r, col) === kc))
      : rows;
    const colSize = col === "sz" && hasCol ? (String(kc) as SizeColumn) : null;
    const a = colSize ? aggregateRowMetricsForSize(subset, colSize) : aggregateRowMetrics(subset);
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
  if (dim === "none" || dim === "sz") {
    return rows;
  }
  return rows.filter((r) => dimKey(r, dim) === key);
}

export function rowsForPivotCell(
  rows: TableRow[],
  config: PivotExplorerConfig,
  k1: string | number,
  k2: string | number,
  kc: string | number,
): TableRow[] {
  const hasRow2 = config.row2 !== "none";
  const hasCol = config.col !== "none";
  return rows.filter((r) => {
    if (config.row1 !== "sz" && dimKey(r, config.row1) !== k1) return false;
    if (hasRow2 && config.row2 !== "sz" && dimKey(r, config.row2) !== k2) return false;
    if (hasCol && config.col !== "sz" && dimKey(r, config.col) !== kc) return false;
    return true;
  });
}

export function aggregateForPivotKeys(
  rows: TableRow[],
  config: PivotExplorerConfig,
  k1: string | number,
  k2: string | number,
  kc: string | number,
) {
  const hasRow2 = config.row2 !== "none";
  const hasCol = config.col !== "none";
  const subset = rowsForPivotCell(rows, config, k1, k2, kc);
  const size = sizeKeyFromPivot(config, k1, k2, kc, hasRow2, hasCol);
  return size ? aggregateRowMetricsForSize(subset, size) : aggregateRowMetrics(subset);
}

export function rowsForPivotRowTotal(
  rows: TableRow[],
  config: PivotExplorerConfig,
  k1: string | number,
  k2: string | number,
): TableRow[] {
  const hasRow2 = config.row2 !== "none";
  return rows.filter((r) => {
    if (config.row1 !== "sz" && dimKey(r, config.row1) !== k1) return false;
    if (hasRow2 && config.row2 !== "sz" && dimKey(r, config.row2) !== k2) return false;
    return true;
  });
}

export function aggregateForPivotRowTotal(
  rows: TableRow[],
  config: PivotExplorerConfig,
  k1: string | number,
  k2: string | number,
) {
  const hasRow2 = config.row2 !== "none";
  const hasCol = config.col !== "none";
  const subset = rowsForPivotRowTotal(rows, config, k1, k2);
  const size = sizeKeyFromPivot(config, k1, k2, "__", hasRow2, hasCol);
  return size ? aggregateRowMetricsForSize(subset, size) : aggregateRowMetrics(subset);
}

export function rowSubtotal(rows: TableRow[], row1: DimKey, k1: string | number): PivotExplorerCell {
  return aggregateRowMetrics(rowsForDim(rows, row1, k1));
}

export { dimLabel, sellThrough };
