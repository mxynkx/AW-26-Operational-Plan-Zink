import { SEASON_COLUMNS, SIZE_COLUMNS, type SeasonColumn, type SizeColumn } from "./plan";

export interface NumericRange {
  min: string;
  max: string;
}

export interface TableFilters {
  Tag: string;
  Site_Code: string[];
  Month: string[];
  Grade: string[];
  Category: string[];
  Target: NumericRange;
  Sales_Units: NumericRange;
  Total_SOH_Units: NumericRange;
  Sales_By_Size: Record<SizeColumn, NumericRange>;
  SOH_By_Size: Record<SizeColumn, NumericRange>;
  Season_Sales: Record<SeasonColumn, NumericRange>;
  Season_SOH: Record<SeasonColumn, NumericRange>;
}

function emptyRange(): NumericRange {
  return { min: "", max: "" };
}

function emptySizeRanges(): Record<SizeColumn, NumericRange> {
  return Object.fromEntries(SIZE_COLUMNS.map((size) => [size, emptyRange()])) as Record<
    SizeColumn,
    NumericRange
  >;
}

function emptySeasonRanges(): Record<SeasonColumn, NumericRange> {
  return Object.fromEntries(SEASON_COLUMNS.map((season) => [season, emptyRange()])) as Record<
    SeasonColumn,
    NumericRange
  >;
}

export function createEmptyTableFilters(): TableFilters {
  return {
    Tag: "",
    Site_Code: [],
    Month: [],
    Grade: [],
    Category: [],
    Target: emptyRange(),
    Sales_Units: emptyRange(),
    Total_SOH_Units: emptyRange(),
    Sales_By_Size: emptySizeRanges(),
    SOH_By_Size: emptySizeRanges(),
    Season_Sales: emptySeasonRanges(),
    Season_SOH: emptySeasonRanges(),
  };
}
