export type DimKey = "st" | "mo" | "gr" | "cat" | "sz" | "none";

export interface DashboardFilters {
  month: string;
  grade: string;
  siteCode: string;
  categories: string[];
}

export interface PivotPageFilters {
  month: string;
  grade: string;
  siteCode: string;
  category: string;
}

export interface PivotExplorerConfig {
  row1: DimKey;
  row2: DimKey;
  col: DimKey;
  showSales: boolean;
  showSoh: boolean;
  showTarget: boolean;
  showSellThrough: boolean;
}

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  month: "",
  grade: "",
  siteCode: "",
  categories: [],
};

export const DEFAULT_PIVOT_FILTERS: PivotPageFilters = {
  month: "",
  grade: "",
  siteCode: "",
  category: "",
};

export const DEFAULT_PIVOT_EXPLORER: PivotExplorerConfig = {
  row1: "st",
  row2: "cat",
  col: "mo",
  showSales: true,
  showSoh: true,
  showTarget: false,
  showSellThrough: false,
};
