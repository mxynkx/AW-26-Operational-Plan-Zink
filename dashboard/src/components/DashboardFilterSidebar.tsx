import { MONTH_LABELS, MONTH_ORDER } from "../config/months";
import { GRADE_LABELS, GRADE_ORDER } from "../config/months";
import type { PlanMeta } from "../types/plan";
import type { DashboardFilters } from "../types/planFilters";
import { FilterSelect } from "./FilterSelect";

interface DashboardFilterSidebarProps {
  meta: PlanMeta;
  filters: DashboardFilters;
  allCategories: string[];
  onChange: (filters: DashboardFilters) => void;
  onReset: () => void;
}

export function DashboardFilterSidebar({
  meta,
  filters,
  allCategories,
  onChange,
  onReset,
}: DashboardFilterSidebarProps) {
  const selected =
    filters.categories.length > 0 ? new Set(filters.categories) : new Set(allCategories);

  function toggleCategory(cat: string) {
    const next = new Set(selected);
    if (next.has(cat)) {
      if (next.size > 1) {
        next.delete(cat);
      }
    } else {
      next.add(cat);
    }
    onChange({ ...filters, categories: [...next] });
  }

  return (
    <aside className="bg-surface-container-lowest border-r border-surface-border w-[200px] shrink-0 flex flex-col overflow-y-auto p-3 gap-2.5">
      <p className="text-[9.5px] font-bold tracking-widest uppercase text-secondary px-0.5">Filters</p>

      <FilterSelect
        label="Month"
        value={filters.month}
        active={!!filters.month}
        onChange={(month) => onChange({ ...filters, month })}
      >
        <option value="">All Months</option>
        {MONTH_ORDER.map((m) => (
          <option key={m} value={String(m)}>
            {MONTH_LABELS[m]}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Grade"
        value={filters.grade}
        active={!!filters.grade}
        onChange={(grade) => onChange({ ...filters, grade })}
      >
        <option value="">All Grades</option>
        {GRADE_ORDER.map((g) => (
          <option key={g} value={g}>
            {GRADE_LABELS[g] ?? g}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Store"
        value={filters.siteCode}
        active={!!filters.siteCode}
        onChange={(siteCode) => onChange({ ...filters, siteCode })}
      >
        <option value="">All Stores</option>
        {meta.dimensions.Site_Code.map((s) => (
          <option key={s} value={s}>
            Store {s}
          </option>
        ))}
      </FilterSelect>

      <div className="h-px bg-surface-border my-1" />

      <p className="text-[9.5px] font-bold tracking-widest uppercase text-secondary px-0.5">Category</p>
      <div className="border-[1.5px] border-surface-border rounded-md overflow-hidden bg-white">
        {allCategories.map((cat) => {
          const on = selected.has(cat);
          return (
            <button
              key={cat}
              type="button"
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-[12px] border-b border-surface-border last:border-b-0 transition-colors ${
                on ? "bg-primary-fixed" : "hover:bg-surface-container-low"
              }`}
              onClick={() => toggleCategory(cat)}
            >
              <span
                className={`w-3.5 h-3.5 rounded-sm border-[1.5px] flex items-center justify-center shrink-0 ${
                  on ? "bg-primary border-primary" : "border-outline-variant"
                }`}
              >
                {on ? <span className="w-1.5 h-1.5 bg-white rounded-[1px]" /> : null}
              </span>
              <span className="truncate">{cat}</span>
            </button>
          );
        })}
      </div>

      <div className="h-px bg-surface-border my-1" />

      <button
        type="button"
        className="w-full py-1.5 rounded-md border-[1.5px] border-surface-border text-[12px] font-medium text-secondary hover:bg-error hover:text-white hover:border-error transition-colors"
        onClick={onReset}
      >
        Reset Filters
      </button>
    </aside>
  );
}
