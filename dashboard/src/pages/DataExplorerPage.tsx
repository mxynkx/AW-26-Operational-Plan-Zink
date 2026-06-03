import { useEffect, useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import { TopNav } from "../components/TopNav";
import { DEFAULT_PIVOT } from "../config/fields";
import { useData } from "../context/DataContext";
import type { SortDir, SortKey } from "../types/plan";
import { createEmptyTableFilters } from "../types/tableFilters";
import { downloadExcel } from "../utils/download";
import { applyTableFilters, countActiveTableFilters } from "../utils/tableFilters";
import { sortRows } from "../utils/sort";

const PAGE_SIZE = 500;

export function DataExplorerPage() {
  const { rows, meta, loading, error, search, setSearch } = useData();
  const [tableFilters, setTableFilters] = useState(createEmptyTableFilters);
  const [sortKey, setSortKey] = useState<SortKey>("Site_Code");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(false);

  const filteredRows = useMemo(
    () => applyTableFilters(rows, tableFilters, search),
    [rows, tableFilters, search],
  );

  const activeFilterCount = useMemo(() => countActiveTableFilters(tableFilters), [tableFilters]);

  const sortedRows = useMemo(
    () => sortRows(filteredRows, sortKey, sortDir),
    [filteredRows, sortKey, sortDir],
  );

  useEffect(() => {
    setPage(1);
  }, [tableFilters, search, sortKey, sortDir]);

  async function handleDownload() {
    if (!meta || downloading) {
      return;
    }
    setDownloading(true);
    try {
      await downloadExcel(meta.source_file);
    } catch (downloadError) {
      window.alert(downloadError instanceof Error ? downloadError.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
        Loading plan data...
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-error p-8 text-center">
        <div>
          <h1 className="text-headline-md font-bold mb-2">Unable to load data</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <TopNav
        search={search}
        onSearchChange={setSearch}
        excelFilename={meta.source_file}
        onDownload={handleDownload}
        downloading={downloading}
        showSearch
      />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          rows={sortedRows}
          allRowsCount={rows.length}
          meta={meta}
          tableFilters={tableFilters}
          activeFilterCount={activeFilterCount}
          onTableFiltersChange={setTableFilters}
          onClearFilters={() => setTableFilters(createEmptyTableFilters())}
          pivot={DEFAULT_PIVOT}
          sortKey={sortKey}
          sortDir={sortDir}
          page={page}
          pageSize={PAGE_SIZE}
          onSort={handleSort}
          onPageChange={setPage}
          showPivotSummary={false}
        />
      </div>
    </div>
  );
}
