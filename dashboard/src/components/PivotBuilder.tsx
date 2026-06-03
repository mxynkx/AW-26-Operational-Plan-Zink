import { useDroppable, useDraggable } from "@dnd-kit/core";
import { getField } from "../config/fields";
import type { PivotConfig } from "../types/plan";
import { Icon } from "./Icon";

function PivotTag({
  fieldId,
  zone,
  onRemove,
}: {
  fieldId: string;
  zone: keyof PivotConfig;
  onRemove: () => void;
}) {
  const field = getField(fieldId);
  const label = field?.label ?? fieldId;
  const displayLabel = fieldId === "Grade" ? "Store Size" : label;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${zone}-${fieldId}`,
    data: { fieldId, field: getField(fieldId), source: zone },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`bg-white border border-primary-container rounded px-3 py-1 flex items-center gap-2 text-body-md text-on-surface shadow-sm cursor-grab ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <Icon name="drag_indicator" className="text-secondary text-xs" />
      {displayLabel}
      <button
        type="button"
        className="text-secondary hover:text-error"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Icon name="close" className="text-xs" />
      </button>
    </div>
  );
}

function DropZone({
  zone,
  label,
  items,
  onRemove,
}: {
  zone: keyof PivotConfig;
  label: string;
  items: string[];
  onRemove: (fieldId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: zone });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 border-2 border-dashed rounded-lg p-3 min-h-[72px] bg-surface flex flex-col transition-colors ${
        isOver ? "border-primary bg-primary-fixed/30" : "border-surface-border"
      }`}
    >
      <span className="text-label-caps text-secondary mb-2 block">{label}</span>
      <div className="flex flex-wrap gap-2 flex-1 items-start content-start min-h-[32px]">
        {items.length === 0 ? (
          <span className="text-[11px] text-secondary italic">Drop field here</span>
        ) : null}
        {items.map((fieldId) => (
          <PivotTag key={fieldId} fieldId={fieldId} zone={zone} onRemove={() => onRemove(fieldId)} />
        ))}
      </div>
    </div>
  );
}

interface PivotBuilderProps {
  config: PivotConfig;
  onChange: (config: PivotConfig) => void;
}

export function PivotBuilder({ config, onChange }: PivotBuilderProps) {
  function removeFromZone(zone: keyof PivotConfig, fieldId: string) {
    onChange({ ...config, [zone]: config[zone].filter((id) => id !== fieldId) });
  }

  return (
    <div className="bg-surface-container-lowest border-b border-surface-border p-4 shadow-sm z-20 shrink-0">
      <div className="flex flex-col lg:flex-row gap-4">
        <DropZone zone="rows" label="Rows" items={config.rows} onRemove={(id) => removeFromZone("rows", id)} />
        <DropZone zone="cols" label="Columns" items={config.cols} onRemove={(id) => removeFromZone("cols", id)} />
        <DropZone zone="values" label="Values" items={config.values} onRemove={(id) => removeFromZone("values", id)} />
      </div>
    </div>
  );
}
