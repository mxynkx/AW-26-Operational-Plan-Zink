import type { SortDir, SortKey, TableRow } from "../types/plan";

export function sortRows(rows: TableRow[], key: SortKey, dir: SortDir): TableRow[] {
  const sorted = [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];

    if (typeof av === "number" && typeof bv === "number") {
      return av - bv;
    }

    return String(av).localeCompare(String(bv), undefined, { numeric: true });
  });

  return dir === "desc" ? sorted.reverse() : sorted;
}
