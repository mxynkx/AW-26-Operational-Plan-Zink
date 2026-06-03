import { useEffect, useState } from "react";
import type { TableRow } from "../types/plan";
import type { PivotExplorerConfig, PivotPageFilters } from "../types/planFilters";
import { computeKpis } from "../utils/metrics";
import { applyPivotPageFilters } from "../utils/planFilters";
import { buildPivotBodyRows } from "../utils/pivotExplorerBody";

export interface PivotPreparePayload {
  filteredRows: TableRow[];
  built: ReturnType<typeof buildPivotBodyRows>;
  kpis: ReturnType<typeof computeKpis>;
}

export function usePivotPrepare(
  rows: TableRow[],
  filters: PivotPageFilters,
  config: PivotExplorerConfig,
  dataLoading: boolean,
) {
  const [payload, setPayload] = useState<PivotPreparePayload | null>(null);
  const [preparing, setPreparing] = useState(true);

  useEffect(() => {
    if (dataLoading) {
      setPreparing(true);
      setPayload(null);
      return;
    }

    if (rows.length === 0) {
      setPreparing(false);
      setPayload(null);
      return;
    }

    let cancelled = false;
    setPreparing(true);

    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      const filteredRows = applyPivotPageFilters(rows, filters);
      const built = buildPivotBodyRows(filteredRows, config);
      const kpis = computeKpis(filteredRows);

      if (!cancelled) {
        setPayload({ filteredRows, built, kpis });
        setPreparing(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [dataLoading, rows, filters, config]);

  const showFullPageLoader = dataLoading || (preparing && payload === null);

  return {
    payload,
    preparing,
    showFullPageLoader,
  };
}
