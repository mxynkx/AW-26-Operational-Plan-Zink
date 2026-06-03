import { aggregateRowMetrics } from "./metrics";
import { dimKey, dimLabel } from "./dimensions";
import {
  buildPivotExplorer,
  sellThrough,
  type PivotExplorerCell,
  type PivotExplorerResult,
} from "./pivotExplorer";
import type { TableRow } from "../types/plan";
import type { PivotExplorerConfig } from "../types/planFilters";

export interface PivotBodyRow {
  kind: "data" | "subtotal";
  row1Key: string | number;
  row1Label: string;
  row1RowSpan: number;
  showRow1: boolean;
  row2Label: string | null;
  colCells: PivotExplorerCell[];
  rowTotal: PivotExplorerCell & { st: number };
  groupBorder: boolean;
}

export function buildPivotBodyRows(
  rows: TableRow[],
  config: PivotExplorerConfig,
): { result: PivotExplorerResult; body: PivotBodyRow[] } | null {
  const result = buildPivotExplorer(rows, config);
  if (!result) {
    return null;
  }

  const body: PivotBodyRow[] = [];
  const { row1Keys, row2Keys, colKeys, hasRow2, hasCol, getCell } = result;
  const subtotalSpan = hasRow2 ? row2Keys.length + 1 : row2Keys.length;

  for (let ri = 0; ri < row1Keys.length; ri++) {
    const k1 = row1Keys[ri];

    for (let r2i = 0; r2i < row2Keys.length; r2i++) {
      const k2 = row2Keys[r2i];
      const colCells = colKeys.map((kc) => getCell(k1, k2, kc));

      let sales = 0;
      let soh = 0;
      for (const c of colCells) {
        sales += c.sales;
        soh += c.soh;
      }
      const rowSubset = rows.filter((r) => {
        if (dimKey(r, config.row1) !== k1) return false;
        if (hasRow2 && dimKey(r, config.row2) !== k2) return false;
        return true;
      });
      const agg = aggregateRowMetrics(rowSubset);

      body.push({
        kind: "data",
        row1Key: k1,
        row1Label: dimLabel(k1, config.row1),
        row1RowSpan: subtotalSpan,
        showRow1: hasRow2 ? r2i === 0 : true,
        row2Label: hasRow2 ? dimLabel(k2, config.row2) : null,
        colCells,
        rowTotal: { sales: agg.sales, soh: agg.soh, target: agg.target, st: agg.sellThrough / 100 },
        groupBorder: ri > 0 && r2i === 0,
      });
    }

    if (hasRow2) {
      const subColCells = colKeys.map((kc) => {
        const subset = rows.filter(
          (r) => dimKey(r, config.row1) === k1 && (!hasCol || dimKey(r, config.col) === kc),
        );
        const a = aggregateRowMetrics(subset);
        return { sales: a.sales, soh: a.soh, target: a.target };
      });
      const subAll = aggregateRowMetrics(rows.filter((r) => dimKey(r, config.row1) === k1));
      body.push({
        kind: "subtotal",
        row1Key: k1,
        row1Label: dimLabel(k1, config.row1),
        row1RowSpan: 0,
        showRow1: false,
        row2Label: "Subtotal",
        colCells: subColCells,
        rowTotal: {
          sales: subAll.sales,
          soh: subAll.soh,
          target: subAll.target,
          st: subAll.sellThrough / 100,
        },
        groupBorder: false,
      });
    }
  }

  return { result, body };
}

export { sellThrough };
