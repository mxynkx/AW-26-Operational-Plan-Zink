import type { GlobalFilters, TableRow } from "../types/plan";

export function applyGlobalFilters(rows: TableRow[], filters: GlobalFilters, search: string): TableRow[] {
  let result = rows;

  if (filters.department !== "All") {
    result = result.filter((row) => row.Category === filters.department);
  }

  if (filters.region !== "All") {
    result = result.filter((row) => row.Grade === filters.region);
  }

  if (filters.season !== "All") {
    const season = filters.season;
    result = result.filter((row) => (row.Season_Sales[season] ?? 0) > 0);
  }

  const query = search.trim().toLowerCase();
  if (query) {
    result = result.filter(
      (row) =>
        row.Site_Code.toLowerCase().includes(query) ||
        row.Tag.toLowerCase().includes(query) ||
        row.Category.toLowerCase().includes(query) ||
        row.Grade.toLowerCase().includes(query),
    );
  }

  return result;
}
