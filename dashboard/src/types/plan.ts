export const SIZE_COLUMNS = ["1XS", "2S", "3M", "4L", "5XL", "6XXL", "7XXXL"] as const;
export const SEASON_COLUMNS = ["Older", "CS-1", "CS", "CS+1"] as const;

export type SizeColumn = (typeof SIZE_COLUMNS)[number];
export type SeasonColumn = (typeof SEASON_COLUMNS)[number];

export interface TableRow {
  Tag: string;
  Site_Code: string;
  Month: number | null;
  Grade: string;
  Category: string;
  Target: number;
  Sales_Units: number;
  Total_SOH_Units: number;
  Sales_By_Size: Record<SizeColumn, number>;
  SOH_By_Size: Record<SizeColumn, number>;
  Season_Sales: Record<SeasonColumn, number>;
  Season_SOH: Record<SeasonColumn, number>;
  Season_Code: "AW26" | "SS26";
}

export interface PlanMeta {
  source_file: string;
  row_count_raw: number;
  dimensions: {
    Site_Code: string[];
    Month: number[];
    Grade: string[];
    Category: string[];
    Size: string[];
    Season: string[];
  };
  verification: {
    sales_units_row_total: number;
    total_soh_row_total: number;
    target_store_month_total: number;
  };
}

export type DimensionId = "Site_Code" | "Month" | "Grade" | "Category" | "Tag" | "Size";
export type MetricId =
  | "Target"
  | "Sales_Units"
  | "Total_SOH_Units"
  | "Sales_By_Size"
  | "SOH_By_Size";

export type PivotZone = "rows" | "cols" | "values" | "available";

export interface FieldItem {
  id: string;
  label: string;
  icon: string;
  kind: "dimension" | "metric";
}

export type SortKey =
  | "Tag"
  | "Site_Code"
  | "Month"
  | "Grade"
  | "Category"
  | "Target"
  | "Sales_Units"
  | "Total_SOH_Units";

export type SortDir = "asc" | "desc";

export interface GlobalFilters {
  season: "All" | SeasonColumn;
  department: "All" | string;
  region: "All" | string;
  brand: "All";
}

export interface PivotConfig {
  rows: string[];
  cols: string[];
  values: string[];
}
