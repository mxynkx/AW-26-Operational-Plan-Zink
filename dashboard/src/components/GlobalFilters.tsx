import type { GlobalFilters as Filters, PlanMeta } from "../types/plan";
import { SEASON_COLUMNS } from "../types/plan";

interface GlobalFiltersProps {
  filters: Filters;
  meta: PlanMeta;
  onChange: (filters: Filters) => void;
}

export function GlobalFiltersBar({ filters, meta, onChange }: GlobalFiltersProps) {
  return (
    <div className="bg-surface-container-low border-b border-surface-border px-4 py-2 flex flex-wrap gap-4 items-center shrink-0">
      <div className="flex items-center gap-2">
        <label className="text-label-caps text-secondary">Season:</label>
        <select
          className="bg-surface-container-lowest border border-surface-border rounded text-body-md py-1 px-2 focus:ring-primary focus:border-primary"
          value={filters.season}
          onChange={(e) => onChange({ ...filters, season: e.target.value as Filters["season"] })}
        >
          <option value="All">All Seasons</option>
          {SEASON_COLUMNS.map((season) => (
            <option key={season} value={season}>
              {season}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-label-caps text-secondary">Department:</label>
        <select
          className="bg-surface-container-lowest border border-surface-border rounded text-body-md py-1 px-2 focus:ring-primary focus:border-primary"
          value={filters.department}
          onChange={(e) => onChange({ ...filters, department: e.target.value })}
        >
          <option value="All">All Departments</option>
          {meta.dimensions.Category.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-label-caps text-secondary">Region:</label>
        <select
          className="bg-surface-container-lowest border border-surface-border rounded text-body-md py-1 px-2 focus:ring-primary focus:border-primary"
          value={filters.region}
          onChange={(e) => onChange({ ...filters, region: e.target.value })}
        >
          <option value="All">Global</option>
          {meta.dimensions.Grade.map((grade) => (
            <option key={grade} value={grade}>
              Grade {grade}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-label-caps text-secondary">Brand:</label>
        <select
          className="bg-surface-container-lowest border border-surface-border rounded text-body-md py-1 px-2 focus:ring-primary focus:border-primary"
          value={filters.brand}
          disabled
        >
          <option value="All">All Brands</option>
        </select>
      </div>
    </div>
  );
}
