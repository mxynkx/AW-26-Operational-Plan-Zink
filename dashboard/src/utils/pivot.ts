import { storeMonthKey, sumTargetDeduplicated } from "./metrics";
import {
  SEASON_COLUMNS,
  SIZE_COLUMNS,
  type MetricId,
  type PivotConfig,
  type SeasonColumn,
  type SizeColumn,
  type TableRow,
} from "../types/plan";

const CELL_SEP = "\0";

function dimensionValue(row: TableRow, dimension: string, size?: SizeColumn | null): string {
  if (dimension === "Size") {
    return size ?? "—";
  }
  const value = row[dimension as keyof TableRow];
  return value == null ? "—" : String(value);
}

function metricValue(row: TableRow, metric: string, size?: SizeColumn | null): number {
  const id = metric as MetricId;

  if (size) {
    if (id === "Sales_Units") {
      return row.Sales_By_Size[size];
    }
    if (id === "Total_SOH_Units") {
      return row.SOH_By_Size[size];
    }
  }

  switch (id) {
    case "Target":
      return row.Target;
    case "Sales_Units":
      return row.Sales_Units;
    case "Total_SOH_Units":
      return row.Total_SOH_Units;
    default:
      return 0;
  }
}

function usesSize(dimensions: string[]): boolean {
  return dimensions.includes("Size");
}

function buildDimensionKey(row: TableRow, dims: string[], size: SizeColumn | null): string {
  if (dims.length === 0) {
    return "Total";
  }
  return dims.map((d) => dimensionValue(row, d, size)).join(" - ");
}

function sizeFromKeys(rowKey: string, colKey: string, rowDims: string[], colDims: string[]): SizeColumn | null {
  if (!usesSize(rowDims) && !usesSize(colDims)) {
    return null;
  }
  return SIZE_COLUMNS.find((s) => rowKey.includes(s) || colKey.includes(s)) ?? null;
}

interface CellAccumulator {
  sums: Record<string, number>;
  targetByStoreMonth: Map<string, number>;
}

function createAccumulator(): CellAccumulator {
  return { sums: {}, targetByStoreMonth: new Map() };
}

function addToAccumulator(
  acc: CellAccumulator,
  row: TableRow,
  metrics: string[],
  sizeLabel: SizeColumn | null,
): void {
  for (const metric of metrics) {
    if (metric === "Target") {
      const key = storeMonthKey(row);
      if (!acc.targetByStoreMonth.has(key)) {
        acc.targetByStoreMonth.set(key, row.Target);
      }
      continue;
    }

    const delta = metricValue(row, metric, sizeLabel);
    acc.sums[metric] = (acc.sums[metric] ?? 0) + delta;
  }
}

function finalizeAccumulator(acc: CellAccumulator, metrics: string[]): Record<string, number> {
  const values: Record<string, number> = { ...acc.sums };
  if (metrics.includes("Target")) {
    let target = 0;
    for (const v of acc.targetByStoreMonth.values()) {
      target += v;
    }
    values.Target = target;
  }
  return values;
}

export interface PivotCell {
  rowKey: string;
  colKey: string;
  values: Record<string, number>;
}

export interface PivotResult {
  cells: PivotCell[];
  grandTotal: Record<string, number>;
}

export interface PivotGrid {
  rowKeys: string[];
  colKeys: string[];
  getCell: (rowKey: string, colKey: string) => Record<string, number>;
  colTotals: Record<string, Record<string, number>>;
  grandTotal: Record<string, number>;
}

function sortKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function rowsForColKey(rows: TableRow[], colDims: string[], colKey: string): TableRow[] {
  if (colDims.length === 0) {
    return rows;
  }

  const expandSize = usesSize(colDims);
  return rows.filter((row) => {
    const sizes: (SizeColumn | null)[] = expandSize ? [...SIZE_COLUMNS] : [null];
    return sizes.some((size) => buildDimensionKey(row, colDims, size) === colKey);
  });
}

function runPivotAggregation(
  rows: TableRow[],
  config: PivotConfig,
): {
  accumulators: Map<string, CellAccumulator>;
  rowKeys: Set<string>;
  colKeys: Set<string>;
} {
  const { rows: rowDims, cols: colDims, values: metrics } = config;
  const expandSize = usesSize(rowDims) || usesSize(colDims);
  const accumulators = new Map<string, CellAccumulator>();
  const rowKeys = new Set<string>();
  const colKeys = new Set<string>();

  for (const row of rows) {
    const sizes: (SizeColumn | null)[] = expandSize ? [...SIZE_COLUMNS] : [null];

    for (const size of sizes) {
      const rowKey = buildDimensionKey(row, rowDims, size);
      const colKey = buildDimensionKey(row, colDims, size);
      const key = `${rowKey}${CELL_SEP}${colKey}`;

      rowKeys.add(rowKey);
      colKeys.add(colKey);

      let acc = accumulators.get(key);
      if (!acc) {
        acc = createAccumulator();
        accumulators.set(key, acc);
      }

      const sizeLabel = sizeFromKeys(rowKey, colKey, rowDims, colDims);
      addToAccumulator(acc, row, metrics, sizeLabel);
    }
  }

  return { accumulators, rowKeys, colKeys };
}

export function buildPivotGrid(rows: TableRow[], config: PivotConfig): PivotGrid {
  const { values: metrics } = config;
  const empty: PivotGrid = {
    rowKeys: [],
    colKeys: [],
    getCell: () => ({}),
    colTotals: {},
    grandTotal: {},
  };

  if (metrics.length === 0) {
    return empty;
  }

  const { accumulators, rowKeys: rowKeySet, colKeys: colKeySet } = runPivotAggregation(rows, config);
  const rowKeys = sortKeys([...rowKeySet]);
  const colKeys = sortKeys([...colKeySet]);

  const cellValues = new Map<string, Record<string, number>>();
  for (const [key, acc] of accumulators) {
    cellValues.set(key, finalizeAccumulator(acc, metrics));
  }

  const colTotals: Record<string, Record<string, number>> = {};
  const { cols: colDims } = config;

  for (const colKey of colKeys) {
    colTotals[colKey] = {};
    for (const metric of metrics) {
      if (metric === "Target") {
        const colRows = rowsForColKey(rows, colDims, colKey);
        colTotals[colKey].Target = sumTargetDeduplicated(colRows);
      } else {
        colTotals[colKey][metric] = 0;
        for (const rowKey of rowKeys) {
          const cell = cellValues.get(`${rowKey}${CELL_SEP}${colKey}`);
          if (cell) {
            colTotals[colKey][metric] = (colTotals[colKey][metric] ?? 0) + (cell[metric] ?? 0);
          }
        }
      }
    }
  }

  const grandTotal: Record<string, number> = {};
  for (const metric of metrics) {
    if (metric === "Target") {
      grandTotal.Target = sumTargetDeduplicated(rows);
    } else {
      grandTotal[metric] = rows.reduce((sum, row) => sum + metricValue(row, metric, null), 0);
    }
  }

  return {
    rowKeys,
    colKeys,
    getCell: (rowKey, colKey) => cellValues.get(`${rowKey}${CELL_SEP}${colKey}`) ?? {},
    colTotals,
    grandTotal,
  };
}

export function buildPivotResult(rows: TableRow[], config: PivotConfig): PivotResult {
  const { values: metrics } = config;

  if (metrics.length === 0) {
    return { cells: [], grandTotal: {} };
  }

  const grid = buildPivotGrid(rows, config);
  const cells: PivotCell[] = [];

  for (const rowKey of grid.rowKeys) {
    for (const colKey of grid.colKeys) {
      cells.push({
        rowKey,
        colKey,
        values: grid.getCell(rowKey, colKey),
      });
    }
  }

  return { cells, grandTotal: grid.grandTotal };
}

export function buildPivotMatrix(rows: TableRow[], config: PivotConfig): PivotCell[] {
  return buildPivotResult(rows, config).cells;
}

/** Sizes shown on dashboard Size Curve (matches reference HTML). */
export const SIZE_CURVE_COLUMNS = ["1XS", "2S", "3M", "4L", "5XL", "6XXL"] as const;

function chartBySizeField(
  rows: TableRow[],
  field: "Sales_By_Size" | "SOH_By_Size",
): { name: string; value: number; percent: number }[] {
  const totals: Record<string, number> = {};

  for (const row of rows) {
    for (const [size, units] of Object.entries(row[field])) {
      totals[size] = (totals[size] ?? 0) + units;
    }
  }

  const total = Object.values(totals).reduce((sum, v) => sum + v, 0) || 1;

  return SIZE_CURVE_COLUMNS.map((size) => ({
    name: size,
    value: totals[size] ?? 0,
    percent: ((totals[size] ?? 0) / total) * 100,
  }));
}

export function chartBySize(rows: TableRow[]) {
  return chartBySizeField(rows, "Sales_By_Size");
}

export function chartBySizeSoh(rows: TableRow[]) {
  return chartBySizeField(rows, "SOH_By_Size");
}

function chartByCategoryField(
  rows: TableRow[],
  field: "Sales_Units" | "Total_SOH_Units",
): { name: string; value: number; percent: number }[] {
  const map = new Map<string, number>();

  for (const row of rows) {
    map.set(row.Category, (map.get(row.Category) ?? 0) + row[field]);
  }

  const total = Array.from(map.values()).reduce((sum, v) => sum + v, 0) || 1;

  return Array.from(map.entries())
    .map(([name, value]) => ({
      name,
      value,
      percent: (value / total) * 100,
    }))
    .sort((a, b) => b.value - a.value);
}

export function chartByCategoryContribution(rows: TableRow[]) {
  return chartByCategoryField(rows, "Sales_Units");
}

export function chartByCategorySoh(rows: TableRow[]) {
  return chartByCategoryField(rows, "Total_SOH_Units");
}

function chartBySeasonField(
  rows: TableRow[],
  field: "Season_Sales" | "Season_SOH",
): { name: string; value: number; percent: number }[] {
  const totals = Object.fromEntries(
    SEASON_COLUMNS.map((season) => [season, 0]),
  ) as Record<SeasonColumn, number>;

  for (const row of rows) {
    for (const season of SEASON_COLUMNS) {
      totals[season] += row[field][season];
    }
  }

  const total = Object.values(totals).reduce((sum, v) => sum + v, 0) || 1;

  return SEASON_COLUMNS.map((season) => ({
    name: season,
    value: totals[season] ?? 0,
    percent: ((totals[season] ?? 0) / total) * 100,
  }));
}

export function chartBySeasonSales(rows: TableRow[]) {
  return chartBySeasonField(rows, "Season_Sales");
}

export function chartBySeasonSoh(rows: TableRow[]) {
  return chartBySeasonField(rows, "Season_SOH");
}
