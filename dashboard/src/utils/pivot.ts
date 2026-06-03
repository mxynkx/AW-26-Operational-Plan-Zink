import { getField } from "../config/fields";
import {
  SIZE_COLUMNS,
  type MetricId,
  type PivotConfig,
  type SizeColumn,
  type TableRow,
} from "../types/plan";

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

function iteratePivotEntries(
  rows: TableRow[],
  rowDims: string[],
  colDims: string[],
  onEntry: (row: TableRow, size: SizeColumn | null) => void,
) {
  const expandSize = usesSize(rowDims) || usesSize(colDims);

  for (const row of rows) {
    if (expandSize) {
      for (const size of SIZE_COLUMNS) {
        onEntry(row, size);
      }
    } else {
      onEntry(row, null);
    }
  }
}

export interface PivotCell {
  rowKey: string;
  colKey: string;
  values: Record<string, number>;
}

export function buildPivotMatrix(rows: TableRow[], config: PivotConfig): PivotCell[] {
  const { rows: rowDims, cols: colDims, values: metrics } = config;
  if (metrics.length === 0) {
    return [];
  }

  const map = new Map<string, PivotCell>();

  iteratePivotEntries(rows, rowDims, colDims, (row, size) => {
    const rowKey = rowDims.length
      ? rowDims.map((d) => dimensionValue(row, d, size)).join(" · ")
      : "Total";
    const colKey = colDims.length
      ? colDims.map((d) => dimensionValue(row, d, size)).join(" · ")
      : "Total";
    const key = `${rowKey}|||${colKey}`;

    if (!map.has(key)) {
      map.set(key, { rowKey, colKey, values: Object.fromEntries(metrics.map((m) => [m, 0])) });
    }

    const cell = map.get(key)!;
    for (const metric of metrics) {
      cell.values[metric] = (cell.values[metric] ?? 0) + metricValue(row, metric, size);
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const rowCmp = a.rowKey.localeCompare(b.rowKey, undefined, { numeric: true });
    return rowCmp !== 0 ? rowCmp : a.colKey.localeCompare(b.colKey, undefined, { numeric: true });
  });
}

function pickDimension(pivot: PivotConfig, preferred: string[], fallback: string): string {
  const all = [...pivot.rows, ...pivot.cols];
  for (const dim of preferred) {
    if (all.includes(dim)) {
      return dim;
    }
  }
  return all[0] ?? fallback;
}

export function chartLineFromPivot(rows: TableRow[], pivot: PivotConfig) {
  const xDim = pickDimension(pivot, ["Month"], "Month");
  const metrics =
    pivot.values.length > 0 ? pivot.values : (["Sales_Units", "Total_SOH_Units"] as const);
  const map = new Map<string, Record<string, number>>();

  iteratePivotEntries(rows, [xDim], [], (row, size) => {
    const key = dimensionValue(row, xDim, size);
    const entry = map.get(key) ?? Object.fromEntries(metrics.map((m) => [m, 0]));

    for (const metric of metrics) {
      entry[metric] = (entry[metric] ?? 0) + metricValue(row, metric, size);
    }

    map.set(key, entry);
  });

  return Array.from(map.entries())
    .map(([key, values]) => ({
      label: xDim === "Month" ? `Month ${key}` : key,
      sales: values.Sales_Units ?? 0,
      soh: values.Total_SOH_Units ?? 0,
      target: values.Target ?? 0,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

export function chartBarFromPivot(rows: TableRow[], pivot: PivotConfig) {
  const dim = pickDimension(pivot, ["Grade", "Site_Code", "Category", "Size"], "Grade");
  const metric = pivot.values[0] ?? "Sales_Units";
  const map = new Map<string, number>();

  iteratePivotEntries(rows, [dim], [], (row, size) => {
    const key = dimensionValue(row, dim, size);
    map.set(key, (map.get(key) ?? 0) + metricValue(row, metric, size));
  });

  return Array.from(map.entries())
    .map(([name, sales]) => ({ grade: name, sales }))
    .sort((a, b) => b.sales - a.sales);
}

export function chartBySize(rows: TableRow[]) {
  const totals: Record<string, number> = {};

  for (const row of rows) {
    for (const [size, units] of Object.entries(row.Sales_By_Size)) {
      totals[size] = (totals[size] ?? 0) + units;
    }
  }

  const total = Object.values(totals).reduce((sum, v) => sum + v, 0) || 1;

  return SIZE_COLUMNS.map((size) => ({
    name: size,
    value: totals[size] ?? 0,
    percent: ((totals[size] ?? 0) / total) * 100,
  })).filter((item) => item.value > 0);
}

export function chartByCategoryContribution(rows: TableRow[]) {
  const map = new Map<string, number>();

  for (const row of rows) {
    map.set(row.Category, (map.get(row.Category) ?? 0) + row.Sales_Units);
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

export function chartPieFromPivot(rows: TableRow[], pivot: PivotConfig) {
  const dim = pickDimension(pivot, ["Category", "Grade", "Site_Code"], "Category");
  const metric = pivot.values[0] ?? "Sales_Units";
  const map = new Map<string, number>();

  iteratePivotEntries(rows, [dim], [], (row, size) => {
    const key = dimensionValue(row, dim, size);
    map.set(key, (map.get(key) ?? 0) + metricValue(row, metric, size));
  });

  const total = Array.from(map.values()).reduce((sum, v) => sum + v, 0) || 1;

  return Array.from(map.entries()).map(([name, value]) => ({
    name,
    value,
    percent: (value / total) * 100,
  }));
}

export function getBarChartTitle(pivot: PivotConfig): string {
  const dim = pickDimension(pivot, ["Grade", "Site_Code", "Category", "Size"], "Grade");
  const field = getField(dim);
  const metric = getField(pivot.values[0] ?? "Sales_Units");
  return `${metric?.label ?? "Units"} by ${field?.label ?? dim}`;
}

export function computeKpis(rows: TableRow[]) {
  const target = rows.reduce((sum, row) => sum + row.Target, 0);
  const sales = rows.reduce((sum, row) => sum + row.Sales_Units, 0);
  const soh = rows.reduce((sum, row) => sum + row.Total_SOH_Units, 0);
  const sellThrough = sales + soh > 0 ? (sales / (sales + soh)) * 100 : 0;

  return { target, sales, soh, sellThrough };
}
