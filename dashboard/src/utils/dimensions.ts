import { GRADE_ORDER, MONTH_LABELS, MONTH_ORDER } from "../config/months";
import { SIZE_COLUMNS, type SizeColumn, type TableRow } from "../types/plan";
import type { DimKey } from "../types/planFilters";

export function isSizeDim(dim: DimKey): boolean {
  return dim === "sz";
}

export function dimKey(row: TableRow, dim: DimKey): string | number {
  switch (dim) {
    case "st":
      return row.Site_Code;
    case "mo":
      return row.Month ?? -1;
    case "gr":
      return row.Grade;
    case "cat":
      return row.Category;
    case "sz":
      return "_";
    default:
      return "_";
  }
}

export function dimLabel(key: string | number, dim: DimKey): string {
  switch (dim) {
    case "st":
      return `Store ${key}`;
    case "mo":
      return MONTH_LABELS[Number(key)] ?? String(key);
    case "gr":
      return String(key);
    case "cat":
      return String(key);
    case "sz":
      return String(key);
    default:
      return String(key);
  }
}

export function sortDimKeys(keys: (string | number)[], dim: DimKey): (string | number)[] {
  const list = [...keys];
  if (dim === "mo") {
    const order = MONTH_ORDER as readonly number[];
    return list.sort(
      (a, b) => order.indexOf(Number(a)) - order.indexOf(Number(b)) || Number(a) - Number(b),
    );
  }
  if (dim === "gr") {
    const order = GRADE_ORDER as readonly string[];
    return list.sort(
      (a, b) => order.indexOf(String(a)) - order.indexOf(String(b)) || String(a).localeCompare(String(b)),
    );
  }
  if (dim === "cat") {
    return list.sort((a, b) => String(a).localeCompare(String(b)));
  }
  if (dim === "sz") {
    const order = SIZE_COLUMNS as readonly string[];
    return list.sort(
      (a, b) => order.indexOf(String(a)) - order.indexOf(String(b)) || String(a).localeCompare(String(b)),
    );
  }
  return list.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
}

export const DIM_LABELS: Record<DimKey, string> = {
  st: "Store",
  mo: "Month",
  gr: "Grade",
  cat: "Category",
  sz: "Size",
  none: "None",
};

export function sizeKeyFromPivot(
  config: { row1: DimKey; row2: DimKey; col: DimKey },
  k1: string | number,
  k2: string | number,
  kc: string | number,
  hasRow2: boolean,
  hasCol: boolean,
): SizeColumn | null {
  if (config.row1 === "sz" && String(k1) !== "__") {
    return String(k1) as SizeColumn;
  }
  if (hasRow2 && config.row2 === "sz" && String(k2) !== "__") {
    return String(k2) as SizeColumn;
  }
  if (hasCol && config.col === "sz" && String(kc) !== "__") {
    return String(kc) as SizeColumn;
  }
  return null;
}
