import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { ChartsPanel } from "../components/ChartsPanel";
import { DashboardFilterSidebar } from "../components/DashboardFilterSidebar";
import { KpiBar } from "../components/KpiBar";
import { useData } from "../context/DataContext";
import {
  DEFAULT_DASHBOARD_FILTERS,
  type DashboardFilters,
} from "../types/planFilters";
import { computeKpis } from "../utils/metrics";
import {
  chartByCategorySoh,
  chartBySeasonSoh,
  chartBySizeSoh,
} from "../utils/pivot";
import {
  applyDashboardFilters,
  countUniqueStores,
} from "../utils/planFilters";

export function DashboardPage() {
  const { rows, meta, loading, error } = useData();
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_DASHBOARD_FILTERS);

  // Reset filter if no longer valid after a season change
  useEffect(() => {
    if (filters.month && !meta?.dimensions.Month.map(String).includes(filters.month)) {
      setFilters((prev) => ({ ...prev, month: "" }));
    }
    if (filters.siteCode && !meta?.dimensions.Site_Code.includes(filters.siteCode)) {
      setFilters((prev) => ({ ...prev, siteCode: "" }));
    }
  }, [meta, filters.month, filters.siteCode]);

  const categories = meta?.dimensions.Category ?? [];

  const filteredRows = useMemo(
    () =>
      applyDashboardFilters(
        rows,
        filters.categories.length > 0
          ? filters
          : { ...filters, categories: categories },
      ),
    [rows, filters, categories],
  );

  const kpis = useMemo(() => computeKpis(filteredRows), [filteredRows]);
  const sizeSoh = useMemo(() => chartBySizeSoh(filteredRows), [filteredRows]);
  const categorySoh = useMemo(() => chartByCategorySoh(filteredRows), [filteredRows]);
  const seasonSoh = useMemo(() => chartBySeasonSoh(filteredRows), [filteredRows]);

  function resetFilters() {
    setFilters(DEFAULT_DASHBOARD_FILTERS);
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="w-8 h-8 border-[3px] border-surface-border border-t-primary rounded-full animate-spin" />
        <p className="text-[13px] text-secondary font-medium">Loading plan data...</p>
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-error p-8 text-center">
        <div>
          <h1 className="text-headline-md font-bold mb-2">Unable to load dashboard</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <DashboardFilterSidebar
          meta={meta}
          filters={filters}
          allCategories={categories}
          onChange={setFilters}
          onReset={resetFilters}
        />
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
          <KpiBar
            target={kpis.target}
            sales={kpis.sales}
            soh={kpis.soh}
            sellThrough={kpis.sellThrough}
            storeCount={countUniqueStores(filteredRows)}
          />
          <ChartsPanel
            categorySoh={categorySoh}
            sizeSoh={sizeSoh}
            seasonSoh={seasonSoh}
          />
        </div>
      </div>
    </AppShell>
  );
}
