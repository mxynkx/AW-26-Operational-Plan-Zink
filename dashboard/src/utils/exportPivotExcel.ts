import * as XLSX from "xlsx";
import type { PivotTableBuilt } from "../components/PivotExplorerTable";
import { DIM_LABELS, dimLabel } from "./dimensions";
import { sellThrough } from "./pivotExplorerBody";
import type { PivotExplorerCell, PivotMetric } from "./pivotExplorer";
import type { PivotExplorerConfig } from "../types/planFilters";

function metricValue(cell: PivotExplorerCell, st: number, metric: PivotMetric): number {
  switch (metric.key) {
    case "sales":
      return cell.sales;
    case "soh":
      return cell.soh;
    case "target":
      return cell.target;
    case "sellThrough":
      return Math.round(st * 1000) / 10;
    default:
      return 0;
  }
}

function appendMetricCells(
  row: (string | number)[],
  cell: PivotExplorerCell,
  st: number,
  metrics: PivotMetric[],
): void {
  for (const m of metrics) {
    row.push(metricValue(cell, st, m));
  }
}

export function downloadPivotExcel(built: PivotTableBuilt, config: PivotExplorerConfig): void {
  const { result, body } = built;
  const { metrics, colKeys, hasRow2, hasCol, colGrand, grand } = result;
  const labelCols = hasRow2 ? 2 : 1;

  const header1: (string | number)[] = [];
  const header2: (string | number)[] = [];

  header1.push(DIM_LABELS[config.row1]);
  header2.push("");
  if (hasRow2) {
    header1.push(DIM_LABELS[config.row2]);
    header2.push("");
  }

  const pushColGroup = (title: string) => {
    header1.push(title);
    for (let i = 1; i < metrics.length; i++) {
      header1.push("");
    }
    for (const m of metrics) {
      header2.push(m.label);
    }
  };

  if (hasCol) {
    for (const kc of colKeys) {
      pushColGroup(dimLabel(kc, config.col));
    }
  } else {
    pushColGroup("All");
  }
  pushColGroup("TOTAL");

  const sheetRows: (string | number)[][] = [header1, header2];

  for (const row of body) {
    const line: (string | number)[] = [];
    line.push(row.showRow1 ? row.row1Label : "");
    if (hasRow2) {
      line.push(row.row2Label ?? "");
    }
    for (const cell of row.colCells) {
      appendMetricCells(line, cell, sellThrough(cell), metrics);
    }
    appendMetricCells(line, row.rowTotal, row.rowTotal.st, metrics);
    sheetRows.push(line);
  }

  const totalRow: (string | number)[] = ["GRAND TOTAL"];
  if (hasRow2) {
    totalRow.push("");
  }
  if (hasCol) {
    for (const kc of colKeys) {
      const cg = colGrand.get(kc)!;
      appendMetricCells(totalRow, cg, cg.st, metrics);
    }
  } else {
    appendMetricCells(totalRow, grand, grand.st, metrics);
  }
  appendMetricCells(totalRow, grand, grand.st, metrics);
  sheetRows.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);
  ws["!cols"] = sheetRows[0].map((_, i) => ({
    wch: i < labelCols ? 18 : 12,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pivot View");

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `AW26_Pivot_Export_${stamp}.xlsx`);
}
