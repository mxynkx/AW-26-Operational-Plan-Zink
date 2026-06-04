import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { FilterSelect } from "../components/FilterSelect";
import { KpiBar } from "../components/KpiBar";
import { LoadingOverlay, LoadingPanel } from "../components/LoadingPanel";
import { PivotExplorerTable } from "../components/PivotExplorerTable";
import { MONTH_LABELS, MONTH_ORDER, GRADE_ORDER, GRADE_LABELS } from "../config/months";
import { useData } from "../context/DataContext";
import { usePivotPrepare } from "../hooks/usePivotPrepare";
import {
  DEFAULT_PIVOT_EXPLORER,
  DEFAULT_PIVOT_FILTERS,
  type DimKey,
  type PivotExplorerConfig,
  type PivotPageFilters,
} from "../types/planFilters";
import { DIM_LABELS } from "../utils/dimensions";
import {
  countUniqueStores,
} from "../utils/planFilters";
import { formatNumber } from "../utils/format";
import { downloadPivotExcel } from "../utils/exportPivotExcel";

const DIM_OPTIONS: DimKey[] = ["st", "mo", "gr", "cat", "sn", "sz", "none"];

function DimSelect({
  value,
  onChange,
  colorClass,
  allowNone = true,
}: {
  value: DimKey;
  onChange: (v: DimKey) => void;
  colorClass: string;
  allowNone?: boolean;
}) {
  const options = allowNone ? DIM_OPTIONS : DIM_OPTIONS.filter((d) => d !== "none");
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DimKey)}
      className={`bg-white border-[1.5px] border-surface-border rounded px-2 py-1 text-[12px] font-medium outline-none cursor-pointer ${colorClass}`}
    >
      {options.map((d) => (
        <option key={d} value={d}>
          {DIM_LABELS[d]}
        </option>
      ))}
    </select>
  );
}

export function PivotExplorerPage() {
  const { rows, meta, loading, error } = useData();
  const [filters, setFilters] = useState<PivotPageFilters>(DEFAULT_PIVOT_FILTERS);
  const [config, setConfig] = useState<PivotExplorerConfig>(DEFAULT_PIVOT_EXPLORER);
  const [exporting, setExporting] = useState(false);

  const { payload, preparing, showFullPageLoader } = usePivotPrepare(
    rows,
    filters,
    config,
    loading,
  );

  function patchFilters(patch: Partial<PivotPageFilters>) {
    setFilters((f) => ({ ...f, ...patch }));
  }

  function resetFilters() {
    setFilters(DEFAULT_PIVOT_FILTERS);
  }

  function resetPivotConfig() {
    setConfig(DEFAULT_PIVOT_EXPLORER);
  }

  function handleDownloadExcel() {
    if (!payload?.built) {
      window.alert("Pivot table is not ready yet. Please wait for it to finish loading.");
      return;
    }
    setExporting(true);
    try {
      downloadPivotExcel(payload.built, config);
    } catch (exportError) {
      window.alert(exportError instanceof Error ? exportError.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  if (error || (!loading && !meta)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-error p-8 text-center">
        <div>
          <h1 className="text-headline-md font-bold mb-2">Unable to load data</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (showFullPageLoader) {
    return (
      <AppShell>
        <LoadingPanel
          message={loading ? "Loading plan data…" : "Building pivot explorer…"}
          submessage={
            loading
              ? "Reading store and category rows"
              : "Aggregating metrics — this may take a few seconds"
          }
        />
      </AppShell>
    );
  }

  const filteredRows = payload?.filteredRows ?? [];
  const kpis = payload?.kpis ?? { target: 0, sales: 0, soh: 0, sellThrough: 0 };
  const built = payload?.built ?? null;

  return (
    <AppShell>
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <div className="flex items-center flex-wrap gap-2 px-4 py-2 bg-surface-container-lowest border-b border-surface-border shrink-0 shadow-sm">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">Store</span>
          <FilterSelect
            value={filters.siteCode}
            active={!!filters.siteCode}
            onChange={(siteCode) => patchFilters({ siteCode })}
          >
            <option value="">All Stores</option>
            {meta!.dimensions.Site_Code.map((s) => (
              <option key={s} value={s}>
                Store {s}
              </option>
            ))}
          </FilterSelect>
          <div className="w-px h-5 bg-surface-border" />
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">Month</span>
          <FilterSelect
            value={filters.month}
            active={!!filters.month}
            onChange={(month) => patchFilters({ month })}
          >
            <option value="">All</option>
            {MONTH_ORDER.map((m) => (
              <option key={m} value={String(m)}>
                {MONTH_LABELS[m]}
              </option>
            ))}
          </FilterSelect>
          <div className="w-px h-5 bg-surface-border" />
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">Grade</span>
          <FilterSelect
            value={filters.grade}
            active={!!filters.grade}
            onChange={(grade) => patchFilters({ grade })}
          >
            <option value="">All</option>
            {GRADE_ORDER.map((g) => (
              <option key={g} value={g}>
                {GRADE_LABELS[g] ?? g}
              </option>
            ))}
          </FilterSelect>
          <div className="w-px h-5 bg-surface-border" />
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">Category</span>
          <FilterSelect
            value={filters.category}
            active={!!filters.category}
            onChange={(category) => patchFilters({ category })}
          >
            <option value="">All</option>
            {meta!.dimensions.Category.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FilterSelect>
          <div className="w-px h-5 bg-surface-border" />
          <button
            type="button"
            className="px-2.5 py-1 rounded-md border-[1.5px] border-surface-border text-[12px] font-medium text-secondary hover:bg-error hover:text-white hover:border-error"
            onClick={resetFilters}
          >
            Reset
          </button>
          <span className="ml-auto text-[11px] font-semibold text-secondary bg-surface-container-low px-2.5 py-0.5 rounded-full border border-surface-border">
            {formatNumber(filteredRows.length)} rows
          </span>
        </div>

        <KpiBar
          compact
          target={kpis.target}
          sales={kpis.sales}
          soh={kpis.soh}
          sellThrough={kpis.sellThrough}
          storeCount={countUniqueStores(filteredRows)}
        />

        <div className="flex items-center flex-wrap gap-2 px-4 py-1.5 bg-surface-container-lowest border-b border-surface-border shrink-0">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">Pivot</span>
          <div className="flex items-center gap-1.5 bg-surface-container-low border-[1.5px] border-surface-border rounded-md px-2.5 py-1">
            <span className="text-[10px] font-bold text-primary uppercase">Rows</span>
            <DimSelect
              value={config.row1}
              onChange={(row1) => setConfig((c) => ({ ...c, row1 }))}
              colorClass="text-primary border-primary/30"
              allowNone={false}
            />
            <span className="text-[11px] text-secondary">then</span>
            <DimSelect
              value={config.row2}
              onChange={(row2) => setConfig((c) => ({ ...c, row2 }))}
              colorClass="text-primary border-primary/30"
            />
          </div>
          <div className="w-px h-6 bg-surface-border" />
          <div className="flex items-center gap-1.5 bg-surface-container-low border-[1.5px] border-surface-border rounded-md px-2.5 py-1">
            <span className="text-[10px] font-bold text-success-emerald uppercase">Cols</span>
            <DimSelect
              value={config.col}
              onChange={(col) => setConfig((c) => ({ ...c, col }))}
              colorClass="text-success-emerald"
            />
          </div>
          <div className="w-px h-6 bg-surface-border" />
          <div className="flex items-center gap-2 bg-surface-container-low border-[1.5px] border-surface-border rounded-md px-2.5 py-1">
            <span className="text-[10px] font-bold text-tertiary uppercase">Show</span>
            {(
              [
                ["showSales", "Sales", config.showSales],
                ["showSoh", "SOH", config.showSoh],
                ["showTarget", "Target", config.showTarget],
                ["showSellThrough", "ST%", config.showSellThrough],
              ] as const
            ).map(([key, label, checked]) => (
              <label key={key} className="flex items-center gap-1 text-[12px] font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, [key]: e.target.checked }))
                  }
                  className="accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="w-px h-6 bg-surface-border" />
          <button
            type="button"
            className="px-2.5 py-1 rounded-md border-[1.5px] border-surface-border text-[12px] font-medium text-secondary hover:bg-error hover:text-white hover:border-error"
            onClick={resetPivotConfig}
          >
            Reset
          </button>
          <button
            type="button"
            disabled={!built || preparing || exporting}
            className="ml-auto px-3 py-1.5 rounded-md bg-primary text-white text-[12px] font-semibold hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            onClick={handleDownloadExcel}
          >
            {exporting ? "Exporting…" : "Download Excel"}
          </button>
        </div>

        <div className="relative flex-1 min-h-0 flex flex-col">
          {preparing ? <LoadingOverlay message="Updating pivot table…" /> : null}
          <PivotExplorerTable built={built} config={config} />
        </div>
      </div>
    </AppShell>
  );
}
