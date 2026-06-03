import { useMemo } from "react";
import { ChartsPanel } from "../components/ChartsPanel";
import { KpiBar } from "../components/KpiBar";
import { TopNav } from "../components/TopNav";
import { useData } from "../context/DataContext";
import { chartByCategoryContribution, chartBySize, computeKpis } from "../utils/pivot";
import { applyTableFilters } from "../utils/tableFilters";
import { createEmptyTableFilters } from "../types/tableFilters";

export function DashboardPage() {
  const { rows, meta, loading, error, search, setSearch } = useData();

  const filteredRows = useMemo(
    () => applyTableFilters(rows, createEmptyTableFilters(), search),
    [rows, search],
  );

  const kpis = useMemo(() => computeKpis(filteredRows), [filteredRows]);
  const sizeChart = useMemo(() => chartBySize(filteredRows), [filteredRows]);
  const categoryChart = useMemo(() => chartByCategoryContribution(filteredRows), [filteredRows]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
        Loading operational plan...
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-error p-8 text-center">
        <div>
          <h1 className="text-headline-md font-bold mb-2">Unable to load dashboard</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav search={search} onSearchChange={setSearch} showSearch />
      <KpiBar
        target={kpis.target}
        sales={kpis.sales}
        soh={kpis.soh}
        sellThrough={kpis.sellThrough}
      />
      <main className="flex-1 overflow-auto">
        <ChartsPanel sizeData={sizeChart} categoryData={categoryChart} />
        <div className="p-6 text-center text-secondary text-body-md">
          <p>
            Showing summary for {filteredRows.length.toLocaleString("en-IN")} rows
            {search ? " (search applied)" : ""}.
          </p>
          <p className="mt-1">
            Open <strong className="text-primary">Plan Data</strong> for the full table with column filters.
          </p>
        </div>
      </main>
    </div>
  );
}
