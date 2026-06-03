import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PlanMeta, TableRow } from "../types/plan";
import { createEmptyTableFilters } from "../types/tableFilters";
import { applyTableFilters } from "../utils/tableFilters";

interface DataContextValue {
  rows: TableRow[];
  meta: PlanMeta | null;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  filteredRows: TableRow[];
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [meta, setMeta] = useState<PlanMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [tableResponse, metaResponse] = await Promise.all([
          fetch("/data/table.json"),
          fetch("/data/meta.json"),
        ]);

        if (!tableResponse.ok || !metaResponse.ok) {
          throw new Error("Plan data not found. Run: python scripts/convert_excel.py");
        }

        const [tableData, metaData] = await Promise.all([
          tableResponse.json() as Promise<TableRow[]>,
          metaResponse.json() as Promise<PlanMeta>,
        ]);

        setRows(tableData);
        setMeta(metaData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredRows = useMemo(
    () => applyTableFilters(rows, createEmptyTableFilters(), search),
    [rows, search],
  );

  const value = useMemo(
    () => ({
      rows,
      meta,
      loading,
      error,
      search,
      setSearch,
      filteredRows,
    }),
    [rows, meta, loading, error, search, filteredRows],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within DataProvider");
  }
  return ctx;
}
