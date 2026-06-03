import type { SortKey } from "../types/plan";

export interface PinnedColumn {
  id: string;
  label: string;
  sortKey: SortKey;
  width: number;
  align?: "left" | "center" | "right";
}

export const PINNED_COLUMNS: PinnedColumn[] = [
  { id: "Tag", label: "Tag", sortKey: "Tag", width: 96 },
  { id: "Site_Code", label: "Site_Code", sortKey: "Site_Code", width: 96 },
  { id: "Month", label: "Month", sortKey: "Month", width: 72, align: "center" },
  { id: "Grade", label: "Grade", sortKey: "Grade", width: 72, align: "center" },
  { id: "Category", label: "Category", sortKey: "Category", width: 148 },
];

export const PINNED_WIDTH = PINNED_COLUMNS.reduce((sum, col) => sum + col.width, 0);

export function pinnedLeft(index: number): number {
  return PINNED_COLUMNS.slice(0, index).reduce((sum, col) => sum + col.width, 0);
}
