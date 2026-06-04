import {
  aggregateRowMetrics,
  aggregateRowMetricsForSeason,
  aggregateRowMetricsForSize,
  storeMonthKey,
} from "./metrics";
import {
  dimKey,
  dimLabel,
  isSliceDim,
  sliceKeyFromPivot,
  sortDimKeys,
  DIM_LABELS,
  type PivotSlice,
} from "./dimensions";
import {
  SEASON_COLUMNS,
  SIZE_COLUMNS,
  type SeasonColumn,
  type SizeColumn,
  type TableRow,
} from "../types/plan";
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

function usesSliceDim(config: PivotExplorerConfig): boolean {
  return isSliceDim(config.row1) || isSliceDim(config.row2) || isSliceDim(config.col);
}

function addRow(cell: PivotExplorerCell, row: TableRow, slice: PivotSlice, includeTarget: boolean): void {
  if (slice.size) {
    cell.sales += row.Sales_By_Size[slice.size];
    cell.soh += row.SOH_By_Size[slice.size];
    return;
  }
  if (slice.season) {
    cell.sales += row.Season_Sales[slice.season] ?? 0;
    cell.soh += row.Season_SOH[slice.season] ?? 0;
    return;
  }
  cell.sales += row.Sales_Units;
  cell.soh += row.Total_SOH_Units;
  if (!includeTarget) {
    return;
  }
  const sm = storeMonthKey(row);
  const seen = (cell as PivotExplorerCell & { _seen?: Set<string> })._seen ?? new Set<string>();
  if (!seen.has(sm)) {
    seen.add(sm);
    cell.target += row.Target;
  }
  (cell as PivotExplorerCell & { _seen?: Set<string> })._seen = seen;
}

type SliceSlot = SizeColumn | SeasonColumn | null;

function dimensionSlots(dim: DimKey, use: boolean): SliceSlot[] {
  if (!use || dim === "none") {
    return [null];
  }
  if (dim === "sz") {
    return [...SIZE_COLUMNS];
  }
  if (dim === "sn") {
    return [...SEASON_COLUMNS];
  }
  return [null];
}

function sliceKeyForDim(dim: DimKey, slot: SliceSlot, row: TableRow): string | number {
  if (dim === "sz" || dim === "sn") {
    return slot!;
  }
  return dimKey(row, dim);
}

function resolveSlice(
  s1: SliceSlot,
  s2: SliceSlot,
  sc: SliceSlot,
  config: PivotExplorerConfig,
  hasRow2: boolean,
  hasCol: boolean,
): PivotSlice | null {
  const sizes: SizeColumn[] = [];
  const seasons: SeasonColumn[] = [];

  const collect = (dim: DimKey, slot: SliceSlot) => {
    if (dim === "sz" && slot) {
      sizes.push(slot as SizeColumn);
    }
    if (dim === "sn" && slot) {
      seasons.push(slot as SeasonColumn);
    }
  };

  collect(config.row1, s1);
  if (hasRow2) {
    collect(config.row2, s2);
  }
  if (hasCol) {
    collect(config.col, sc);
  }

  if (sizes.length > 1 && !sizes.every((s) => s === sizes[0])) {
    return null;
  }
  if (seasons.length > 1 && !seasons.every((s) => s === seasons[0])) {
    return null;
  }
  if (sizes.length > 0 && seasons.length > 0) {
    return null;
  }

  const size = sizes[0] ?? null;
  const season = seasons[0] ?? null;
  if ((s1 || s2 || sc) && !size && !season) {
    return null;
  }

  return { size, season };
}

function aggregateForSlice(rows: TableRow[], slice: PivotSlice) {
  if (slice.size) {
    return aggregateRowMetricsForSize(rows, slice.size);
  }
  if (slice.season) {
    return aggregateRowMetricsForSeason(rows, slice.season);
  }
  return aggregateRowMetrics(rows);
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

  const slots1 = dimensionSlots(row1, true);
  const slots2 = dimensionSlots(row2, hasRow2);
  const slotsC = dimensionSlots(col, hasCol);
  const includeTarget = !usesSliceDim(config);

  for (const row of rows) {
    for (const s1 of slots1) {
      for (const s2 of slots2) {
        for (const sc of slotsC) {
          const slice = resolveSlice(s1, s2, sc, config, hasRow2, hasCol);
          if ((s1 || s2 || sc) && !slice) {
            continue;
          }
          const activeSlice = slice ?? { size: null, season: null };

          const k1 = sliceKeyForDim(row1, s1, row);
          const k2 = hasRow2 ? sliceKeyForDim(row2, s2, row) : "__";
          const kc = hasCol ? sliceKeyForDim(col, sc, row) : "__";
          r1Set.add(k1);
          r2Set.add(k2);
          cSet.add(kc);
          const key = tripleKey(k1, k2, kc);
          let cell = map.get(key);
          if (!cell) {
            cell = emptyPivotCell();
            map.set(key, cell);
          }
          addRow(cell, row, activeSlice, includeTarget);
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
    const subset = hasCol && !isSliceDim(col) ? rows.filter((r) => dimKey(r, col) === kc) : rows;
    const colSlice = hasCol && isSliceDim(col) ? sliceKeyFromPivot(config, "__", "__", kc, false, true) : { size: null, season: null };
    const a = aggregateForSlice(subset, colSlice);
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
  if (dim === "none" || isSliceDim(dim)) {
    return rows;
  }
  return rows.filter((r) => dimKey(r, dim) === key);
}

function matchesPivotDim(
  row: TableRow,
  dim: DimKey,
  key: string | number,
): boolean {
  if (dim === "none" || isSliceDim(dim) || key === "__") {
    return true;
  }
  return dimKey(row, dim) === key;
}

export function rowsForPivotCell(
  rows: TableRow[],
  config: PivotExplorerConfig,
  k1: string | number,
  k2: string | number,
  kc: string | number,
): TableRow[] {
  return rows.filter(
    (r) =>
      matchesPivotDim(r, config.row1, k1) &&
      matchesPivotDim(r, config.row2, k2) &&
      matchesPivotDim(r, config.col, kc),
  );
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
  const slice = sliceKeyFromPivot(config, k1, k2, kc, hasRow2, hasCol);
  return aggregateForSlice(subset, slice);
}

export function rowsForPivotRowTotal(
  rows: TableRow[],
  config: PivotExplorerConfig,
  k1: string | number,
  k2: string | number,
): TableRow[] {
  return rows.filter(
    (r) => matchesPivotDim(r, config.row1, k1) && matchesPivotDim(r, config.row2, k2),
  );
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
  const slice = sliceKeyFromPivot(config, k1, k2, "__", hasRow2, hasCol);
  return aggregateForSlice(subset, slice);
}

export function rowSubtotal(rows: TableRow[], row1: DimKey, k1: string | number): PivotExplorerCell {
  return aggregateRowMetrics(rowsForDim(rows, row1, k1));
}

export { dimLabel, sellThrough };
