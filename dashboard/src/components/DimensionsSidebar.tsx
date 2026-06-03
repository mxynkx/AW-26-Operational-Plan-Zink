import { useDraggable } from "@dnd-kit/core";
import { DIMENSION_FIELDS, METRIC_FIELDS } from "../config/fields";
import type { FieldItem, PivotConfig } from "../types/plan";
import type { PivotZone } from "../hooks/useDragPivot";
import { Icon } from "./Icon";

function DraggableField({
  field,
  placement,
  onAdd,
}: {
  field: FieldItem;
  placement: PivotZone | null;
  onAdd: (fieldId: string, zone: PivotZone) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `dim-${field.id}`,
    data: { field, fieldId: field.id, source: "sidebar" },
  });

  const placementLabel =
    placement === "rows" ? "Rows" : placement === "cols" ? "Cols" : placement === "values" ? "Values" : null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`border rounded p-2 flex items-center justify-between text-body-md shadow-sm cursor-grab transition-colors ${
        isDragging ? "opacity-40" : ""
      } ${
        placement
          ? "bg-primary-fixed/40 border-primary-container"
          : "bg-surface-container-lowest border-surface-border hover:border-primary-container"
      }`}
      title="Drag to Rows, Columns, or Values. Double-click to add to Rows."
      onDoubleClick={() => onAdd(field.id, field.kind === "metric" ? "values" : "rows")}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon name="drag_indicator" className="text-secondary text-sm shrink-0" />
        <Icon name={field.icon} className="text-secondary text-sm shrink-0" />
        <span className="truncate text-on-surface">{field.label}</span>
      </div>
      {placementLabel ? (
        <span className="text-[10px] font-bold uppercase text-primary shrink-0 ml-1">{placementLabel}</span>
      ) : null}
    </div>
  );
}

interface DimensionsSidebarProps {
  pivot: PivotConfig;
  onAddField: (fieldId: string, zone: PivotZone) => void;
}

function getPlacement(fieldId: string, pivot: PivotConfig): PivotZone | null {
  if (pivot.rows.includes(fieldId)) return "rows";
  if (pivot.cols.includes(fieldId)) return "cols";
  if (pivot.values.includes(fieldId)) return "values";
  return null;
}

export function DimensionsSidebar({ pivot, onAddField }: DimensionsSidebarProps) {
  return (
    <aside className="bg-surface-container-low border-r border-surface-border w-sidebar-width hidden md:flex flex-col shrink-0">
      <div className="p-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary-container text-on-primary rounded p-1 flex items-center justify-center">
            <Icon name="dashboard" className="text-sm" />
          </div>
          <div>
            <h2 className="text-title-sm font-bold text-on-surface">Dimensions</h2>
            <p className="text-label-caps text-secondary">Pivot Builder Assets</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <p className="text-[11px] text-secondary leading-snug">
          Drag fields into Rows, Columns, or Values. Double-click to quick-add.
        </p>
        <div className="space-y-2">
          <p className="text-label-caps text-secondary">Dimensions</p>
          {DIMENSION_FIELDS.map((field) => (
            <DraggableField
              key={field.id}
              field={field}
              placement={getPlacement(field.id, pivot)}
              onAdd={onAddField}
            />
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-label-caps text-secondary">Metrics</p>
          {METRIC_FIELDS.map((field) => (
            <DraggableField
              key={field.id}
              field={field}
              placement={getPlacement(field.id, pivot)}
              onAdd={onAddField}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
