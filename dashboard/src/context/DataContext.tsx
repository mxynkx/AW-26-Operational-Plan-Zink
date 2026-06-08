import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PlanMeta, TableRow } from "../types/plan";
import { createEmptyTableFilters } from "../types/tableFilters";
import { applyTableFilters } from "../utils/tableFilters";

interface DataContextValue {
  rows: TableRow[];
  allRows: TableRow[];
  season: "AW26" | "SS26" | "Both";
  setSeason: (season: "AW26" | "SS26" | "Both") => void;
  meta: PlanMeta | null;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  filteredRows: TableRow[];
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [allRows, setAllRows] = useState<TableRow[]>([]);
  const [season, setSeason] = useState<"AW26" | "SS26" | "Both">("AW26");
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

        setAllRows(tableData);
        setMeta(metaData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const rows = useMemo(() => {
    if (season === "Both") return allRows;
    return allRows.filter((r) => r.Season_Code === season);
  }, [allRows, season]);

  const filteredMeta = useMemo(() => {
    if (!meta) return null;
    const activeStores = Array.from(new Set(rows.map((r) => r.Site_Code))).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
    const activeMonths = Array.from(
      new Set(rows.map((r) => r.Month).filter((m) => m !== null) as number[]),
    ).sort((a, b) => {
      const order = [6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
      return order.indexOf(a) - order.indexOf(b);
    });

    return {
      ...meta,
      dimensions: {
        ...meta.dimensions,
        Site_Code: activeStores,
        Month: activeMonths,
      },
    };
  }, [meta, rows]);

  const filteredRows = useMemo(
    () => applyTableFilters(rows, createEmptyTableFilters(), search),
    [rows, search],
  );

  const value = useMemo(
    () => ({
      rows,
      allRows,
      season,
      setSeason,
      meta: filteredMeta,
      loading,
      error,
      search,
      setSearch,
      filteredRows,
    }),
    [rows, allRows, season, filteredMeta, loading, error, search, filteredRows],
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
