import type { NumericRange, TableFilters } from "../types/tableFilters";
import type { SeasonColumn, SizeColumn, TableRow } from "../types/plan";

function inRange(value: number, range: NumericRange): boolean {
  if (range.min !== "") {
    const min = Number(range.min);
    if (!Number.isNaN(min) && value < min) {
      return false;
    }
  }

  if (range.max !== "") {
    const max = Number(range.max);
    if (!Number.isNaN(max) && value > max) {
      return false;
    }
  }

  return true;
}

function matchesMulti(value: string | number | null, selected: string[]): boolean {
  if (selected.length === 0) {
    return true;
  }
  return selected.includes(String(value ?? ""));
}

export function applyTableFilters(
  rows: TableRow[],
  filters: TableFilters,
  search: string,
): TableRow[] {
  const query = search.trim().toLowerCase();

  return rows.filter((row) => {
    if (query) {
      const matchesSearch =
        row.Site_Code.toLowerCase().includes(query) ||
        row.Tag.toLowerCase().includes(query) ||
        row.Category.toLowerCase().includes(query) ||
        row.Grade.toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }
    }

    if (filters.Tag.trim() && !row.Tag.toLowerCase().includes(filters.Tag.trim().toLowerCase())) {
      return false;
    }

    if (!matchesMulti(row.Site_Code, filters.Site_Code)) {
      return false;
    }

    if (!matchesMulti(row.Month, filters.Month)) {
      return false;
    }

    if (!matchesMulti(row.Grade, filters.Grade)) {
      return false;
    }

    if (!matchesMulti(row.Category, filters.Category)) {
      return false;
    }

    if (!inRange(row.Target, filters.Target)) {
      return false;
    }

    if (!inRange(row.Sales_Units, filters.Sales_Units)) {
      return false;
    }

    if (!inRange(row.Total_SOH_Units, filters.Total_SOH_Units)) {
      return false;
    }

    for (const size of Object.keys(filters.Sales_By_Size) as SizeColumn[]) {
      if (!inRange(row.Sales_By_Size[size], filters.Sales_By_Size[size])) {
        return false;
      }
    }

    for (const size of Object.keys(filters.SOH_By_Size) as SizeColumn[]) {
      if (!inRange(row.SOH_By_Size[size], filters.SOH_By_Size[size])) {
        return false;
      }
    }

    for (const season of Object.keys(filters.Season_Sales) as SeasonColumn[]) {
      if (!inRange(row.Season_Sales[season], filters.Season_Sales[season])) {
        return false;
      }
    }

    for (const season of Object.keys(filters.Season_SOH) as SeasonColumn[]) {
      if (!inRange(row.Season_SOH[season], filters.Season_SOH[season])) {
        return false;
      }
    }

    return true;
  });
}

export function countActiveTableFilters(filters: TableFilters): number {
  let count = 0;

  if (filters.Tag.trim()) count += 1;
  if (filters.Site_Code.length) count += 1;
  if (filters.Month.length) count += 1;
  if (filters.Grade.length) count += 1;
  if (filters.Category.length) count += 1;

  const ranges: NumericRange[] = [
    filters.Target,
    filters.Sales_Units,
    filters.Total_SOH_Units,
    ...Object.values(filters.Sales_By_Size),
    ...Object.values(filters.SOH_By_Size),
    ...Object.values(filters.Season_Sales),
    ...Object.values(filters.Season_SOH),
  ];

  for (const range of ranges) {
    if (range.min !== "" || range.max !== "") {
      count += 1;
    }
  }

  return count;
}
