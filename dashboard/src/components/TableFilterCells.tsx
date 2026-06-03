import type { ReactNode } from "react";
import type { NumericRange } from "../types/tableFilters";

const inputClass =
  "w-full min-w-0 px-1 py-0.5 text-[11px] border border-surface-border rounded bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary";

const selectClass =
  "w-full min-w-0 max-h-[72px] px-1 py-0.5 text-[11px] border border-surface-border rounded bg-surface-container-lowest focus:border-primary";

export function TextFilter({
  value,
  onChange,
  placeholder = "Filter…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}

export function MultiSelectFilter({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <select
      multiple
      value={selected}
      onChange={(e) =>
        onChange(Array.from(e.target.selectedOptions, (option) => option.value))
      }
      className={selectClass}
      title="Hold Ctrl/Cmd to select multiple"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function RangeFilter({
  range,
  onChange,
}: {
  range: NumericRange;
  onChange: (range: NumericRange) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <input
        type="number"
        placeholder="Min"
        value={range.min}
        onChange={(e) => onChange({ ...range, min: e.target.value })}
        className={inputClass}
      />
      <input
        type="number"
        placeholder="Max"
        value={range.max}
        onChange={(e) => onChange({ ...range, max: e.target.value })}
        className={inputClass}
      />
    </div>
  );
}

export function FilterTh({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <th
      style={style}
      className={`border-b border-r border-surface-border p-1 bg-surface-container align-top ${className}`}
    >
      {children}
    </th>
  );
}
