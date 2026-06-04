import { GRADE_ORDER, MONTH_LABELS, MONTH_ORDER } from "../config/months";
import { SEASON_COLUMNS, SIZE_COLUMNS, type SeasonColumn, type SizeColumn, type TableRow } from "../types/plan";
import type { DimKey } from "../types/planFilters";

export function isSizeDim(dim: DimKey): boolean {
  return dim === "sz";
}

export function isSeasonDim(dim: DimKey): boolean {
  return dim === "sn";
}

export function isSliceDim(dim: DimKey): boolean {
  return isSizeDim(dim) || isSeasonDim(dim);
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
    case "sn":
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
    case "sn":
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
  if (dim === "sn") {
    const order = SEASON_COLUMNS as readonly string[];
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
  sn: "Season",
  sz: "Size",
  none: "None",
};

export interface PivotSlice {
  size: SizeColumn | null;
  season: SeasonColumn | null;
}

export function sliceKeyFromPivot(
  config: { row1: DimKey; row2: DimKey; col: DimKey },
  k1: string | number,
  k2: string | number,
  kc: string | number,
  hasRow2: boolean,
  hasCol: boolean,
): PivotSlice {
  const slice: PivotSlice = { size: null, season: null };

  if (config.row1 === "sz" && String(k1) !== "__") {
    slice.size = String(k1) as SizeColumn;
  } else if (config.row1 === "sn" && String(k1) !== "__") {
    slice.season = String(k1) as SeasonColumn;
  }

  if (hasRow2 && config.row2 === "sz" && String(k2) !== "__") {
    slice.size = String(k2) as SizeColumn;
  } else if (hasRow2 && config.row2 === "sn" && String(k2) !== "__") {
    slice.season = String(k2) as SeasonColumn;
  }

  if (hasCol && config.col === "sz" && String(kc) !== "__") {
    slice.size = String(kc) as SizeColumn;
  } else if (hasCol && config.col === "sn" && String(kc) !== "__") {
    slice.season = String(kc) as SeasonColumn;
  }

  return slice;
}

/** @deprecated Use sliceKeyFromPivot */
export function sizeKeyFromPivot(
  config: { row1: DimKey; row2: DimKey; col: DimKey },
  k1: string | number,
  k2: string | number,
  kc: string | number,
  hasRow2: boolean,
  hasCol: boolean,
): SizeColumn | null {
  return sliceKeyFromPivot(config, k1, k2, kc, hasRow2, hasCol).size;
}
