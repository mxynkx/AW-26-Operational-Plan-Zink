import type { FieldItem } from "../types/plan";

export const DIMENSION_FIELDS: FieldItem[] = [
  { id: "Site_Code", label: "Site Code", icon: "location_on", kind: "dimension" },
  { id: "Month", label: "Month", icon: "calendar_today", kind: "dimension" },
  { id: "Grade", label: "Grade", icon: "grade", kind: "dimension" },
  { id: "Category", label: "Category", icon: "category", kind: "dimension" },
  { id: "Tag", label: "Tag", icon: "sell", kind: "dimension" },
  { id: "Size", label: "Size", icon: "straighten", kind: "dimension" },
];

export const METRIC_FIELDS: FieldItem[] = [
  { id: "Target", label: "Target", icon: "payments", kind: "metric" },
  { id: "Sales_Units", label: "Sales Units", icon: "shopping_cart", kind: "metric" },
  { id: "Total_SOH_Units", label: "Total SOH Units", icon: "inventory_2", kind: "metric" },
];

export const ALL_FIELDS: FieldItem[] = [...DIMENSION_FIELDS, ...METRIC_FIELDS];

export function getField(id: string): FieldItem | undefined {
  return ALL_FIELDS.find((field) => field.id === id);
}

export const DEFAULT_PIVOT = {
  rows: ["Grade"],
  cols: ["Month"],
  values: ["Sales_Units", "Total_SOH_Units"],
};
