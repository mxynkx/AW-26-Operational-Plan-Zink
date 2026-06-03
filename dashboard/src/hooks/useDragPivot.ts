import type { DragEndEvent } from "@dnd-kit/core";
import { getField } from "../config/fields";
import type { PivotConfig } from "../types/plan";

const ZONES = ["rows", "cols", "values"] as const;

export type PivotZone = (typeof ZONES)[number];

export function resolvePivotZone(overId: string | number): PivotZone | null {
  const id = String(overId);
  if (ZONES.includes(id as PivotZone)) {
    return id as PivotZone;
  }

  for (const zone of ZONES) {
    if (id.startsWith(`${zone}-`)) {
      return zone;
    }
  }

  return null;
}

export function applyDragToPivot(config: PivotConfig, event: DragEndEvent): PivotConfig | null {
  const { active, over } = event;
  if (!over) {
    return null;
  }

  const zone = resolvePivotZone(over.id);
  if (!zone) {
    return null;
  }

  const fieldId =
    (active.data.current?.field as { id: string } | undefined)?.id ??
    (active.data.current?.fieldId as string | undefined);

  if (!fieldId) {
    return null;
  }

  const field = getField(fieldId);
  if (!field) {
    return null;
  }

  if (field.kind === "metric" && zone !== "values") {
    return null;
  }

  if (field.kind === "dimension" && zone === "values") {
    return null;
  }

  const next: PivotConfig = {
    rows: config.rows.filter((id) => id !== fieldId),
    cols: config.cols.filter((id) => id !== fieldId),
    values: config.values.filter((id) => id !== fieldId),
  };

  if (!next[zone].includes(fieldId)) {
    next[zone] = [...next[zone], fieldId];
  }

  return next;
}

export function addFieldToPivotZone(
  config: PivotConfig,
  fieldId: string,
  zone: PivotZone,
): PivotConfig | null {
  const field = getField(fieldId);
  if (!field) {
    return null;
  }

  if (field.kind === "metric" && zone !== "values") {
    return null;
  }

  if (field.kind === "dimension" && zone === "values") {
    return null;
  }

  const next: PivotConfig = {
    rows: config.rows.filter((id) => id !== fieldId),
    cols: config.cols.filter((id) => id !== fieldId),
    values: config.values.filter((id) => id !== fieldId),
  };

  if (!next[zone].includes(fieldId)) {
    next[zone] = [...next[zone], fieldId];
  }

  return next;
}
