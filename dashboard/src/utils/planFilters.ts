import type { TableRow } from "../types/plan";
import type { DashboardFilters, PivotPageFilters } from "../types/planFilters";

export function applyDashboardFilters(rows: TableRow[], filters: DashboardFilters): TableRow[] {
  const catSet =
    filters.categories.length > 0 ? new Set(filters.categories) : null;

  return rows.filter((row) => {
    if (filters.month && String(row.Month ?? "") !== filters.month) {
      return false;
    }
    if (filters.grade && row.Grade !== filters.grade) {
      return false;
    }
    if (filters.siteCode && row.Site_Code !== filters.siteCode) {
      return false;
    }
    if (catSet && !catSet.has(row.Category)) {
      return false;
    }
    return true;
  });
}

export function applyPivotPageFilters(rows: TableRow[], filters: PivotPageFilters): TableRow[] {
  return rows.filter((row) => {
    if (filters.month && String(row.Month ?? "") !== filters.month) {
      return false;
    }
    if (filters.grade && row.Grade !== filters.grade) {
      return false;
    }
    if (filters.siteCode && row.Site_Code !== filters.siteCode) {
      return false;
    }
    if (filters.category && row.Category !== filters.category) {
      return false;
    }
    return true;
  });
}

export function countUniqueStores(rows: TableRow[]): number {
  return new Set(rows.map((r) => r.Site_Code)).size;
}

export function countUniqueMonths(rows: TableRow[]): number {
  return new Set(rows.map((r) => r.Month).filter((m) => m != null)).size;
}
