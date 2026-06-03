import { storeMonthKey } from "./metrics";
import { dimKey, dimLabel, sortDimKeys } from "./dimensions";
import type { TableRow } from "../types/plan";
import type { DimKey } from "../types/planFilters";

export interface SummaryCell {
  sales: number;
  soh: number;
  target: number;
}

export interface SummaryTableResult {
  rowKeys: (string | number)[];
  colKeys: (string | number)[];
  cells: Map<string, SummaryCell>;
  rowDim: DimKey;
  colDim: DimKey;
  grand: SummaryCell & { sellThrough: number };
  colTotals: Map<string | number, SummaryCell & { sellThrough: number }>;
}

function cellKey(rowKey: string | number, colKey: string | number): string {
  return `${rowKey}\0${colKey}`;
}

interface MutableCell extends SummaryCell {
  targetSeen: Set<string>;
}

function emptyCell(): MutableCell {
  return { sales: 0, soh: 0, target: 0, targetSeen: new Set() };
}

function addRowToCell(cell: MutableCell, row: TableRow): void {
  cell.sales += row.Sales_Units;
  cell.soh += row.Total_SOH_Units;
  const smKey = storeMonthKey(row);
  if (!cell.targetSeen.has(smKey)) {
    cell.targetSeen.add(smKey);
    cell.target += row.Target;
  }
}

export function buildSummaryTable(
  rows: TableRow[],
  rowDim: DimKey,
  colDim: DimKey,
): SummaryTableResult {
  const map = new Map<string, MutableCell>();
  const rowSet = new Set<string | number>();
  const colSet = new Set<string | number>();

  for (const row of rows) {
    const rk = dimKey(row, rowDim);
    const ck = colDim === "none" ? "_" : dimKey(row, colDim);
    rowSet.add(rk);
    colSet.add(ck);
    const key = cellKey(rk, ck);
    let cell = map.get(key);
    if (!cell) {
      cell = emptyCell();
      map.set(key, cell);
    }
    addRowToCell(cell, row);
  }

  const rowKeys = sortDimKeys([...rowSet], rowDim);
  const colKeys = colDim === "none" ? ["_"] : sortDimKeys([...colSet], colDim);

  let gSales = 0;
  let gSoh = 0;
  const gTargetSeen = new Set<string>();
  let gTarget = 0;

  for (const row of rows) {
    gSales += row.Sales_Units;
    gSoh += row.Total_SOH_Units;
    const sm = storeMonthKey(row);
    if (!gTargetSeen.has(sm)) {
      gTargetSeen.add(sm);
      gTarget += row.Target;
    }
  }

  const colTotals = new Map<string | number, SummaryCell & { sellThrough: number }>();
  for (const ck of colKeys) {
    let cs = 0;
    let ch = 0;
    for (const rk of rowKeys) {
      const c = map.get(cellKey(rk, ck));
      if (c) {
        cs += c.sales;
        ch += c.soh;
      }
    }
    colTotals.set(ck, {
      sales: cs,
      soh: ch,
      target: 0,
      sellThrough: ch > 0 ? cs / ch : 0,
    });
  }

  if (colDim !== "none") {
    for (const ck of colKeys) {
      const targetSeen = new Set<string>();
      let tgt = 0;
      for (const row of rows) {
        if (dimKey(row, colDim) !== ck) {
          continue;
        }
        const sm = storeMonthKey(row);
        if (!targetSeen.has(sm)) {
          targetSeen.add(sm);
          tgt += row.Target;
        }
      }
      const t = colTotals.get(ck)!;
      t.target = tgt;
    }
  }

  return {
    rowKeys,
    colKeys,
    cells: map,
    rowDim,
    colDim,
    grand: {
      sales: gSales,
      soh: gSoh,
      target: gTarget,
      sellThrough: gSoh > 0 ? gSales / gSoh : 0,
    },
    colTotals,
  };
}

export { dimLabel };
