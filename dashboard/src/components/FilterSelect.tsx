import type { ReactNode } from "react";

interface FilterSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  active?: boolean;
  children: ReactNode;
  className?: string;
}

export function FilterSelect({
  label,
  value,
  onChange,
  active,
  children,
  className = "",
}: FilterSelectProps) {
  return (
    <div className={className}>
      {label ? <label className="block text-[11px] font-semibold text-secondary mb-1">{label}</label> : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-surface-container-low border-[1.5px] rounded-md py-1.5 px-2 text-[12px] font-medium outline-none cursor-pointer ${
          active ? "border-primary bg-primary-fixed text-primary" : "border-surface-border text-on-surface"
        }`}
      >
        {children}
      </select>
    </div>
  );
}
