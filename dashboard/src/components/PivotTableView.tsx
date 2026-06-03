import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getField } from "../config/fields";
import type { PivotConfig } from "../types/plan";
import type { TableRow } from "../types/plan";
import { formatCompactCurrency, formatNumber } from "../utils/format";
import { buildPivotGrid } from "../utils/pivot";

interface PivotTableViewProps {
  rows: TableRow[];
  pivot: PivotConfig;
  isUpdating?: boolean;
}

const ROW_HEIGHT_PX = 34;
const VIRTUAL_OVERSCAN = 12;

function formatMetricValue(metricId: string, value: number): string {
  if (metricId === "Target") {
    return formatCompactCurrency(value);
  }
  return formatNumber(value);
}

function useVirtualRange(rowCount: number, scrollRef: React.RefObject<HTMLDivElement | null>) {
  const [range, setRange] = useState({ start: 0, end: Math.min(rowCount, 50) });

  const updateRange = useCallback(() => {
    const el = scrollRef.current;
    if (!el || rowCount === 0) {
      setRange({ start: 0, end: 0 });
      return;
    }

    const scrollTop = el.scrollTop;
    const viewport = el.clientHeight;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT_PX) - VIRTUAL_OVERSCAN);
    const visibleCount = Math.ceil(viewport / ROW_HEIGHT_PX) + VIRTUAL_OVERSCAN * 2;
    const end = Math.min(rowCount, start + visibleCount);
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, [rowCount, scrollRef]);

  useEffect(() => {
    updateRange();
  }, [updateRange, rowCount]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    el.addEventListener("scroll", updateRange, { passive: true });
    const observer = new ResizeObserver(updateRange);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateRange);
      observer.disconnect();
    };
  }, [updateRange, scrollRef]);

  return range;
}

export const PivotTableView = memo(function PivotTableView({
  rows,
  pivot,
  isUpdating = false,
}: PivotTableViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const grid = useMemo(() => buildPivotGrid(rows, pivot), [rows, pivot]);
  const { start, end } = useVirtualRange(grid.rowKeys.length, scrollRef);

  const hasColPivot = pivot.cols.length > 0;
  const metricCount = pivot.values.length;
  const visibleRowKeys = grid.rowKeys.slice(start, end);
  const topSpacer = start * ROW_HEIGHT_PX;
  const bottomSpacer = Math.max(0, (grid.rowKeys.length - end) * ROW_HEIGHT_PX);

  if (pivot.values.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-secondary text-sm">
        Drag metrics into the Values zone to build your pivot table.
      </div>
    );
  }

  const rowHeader = (
    <th
      rowSpan={hasColPivot && metricCount > 1 ? 2 : 1}
      className="p-2 border-r border-b border-surface-border font-semibold sticky left-0 bg-surface-container-low z-20 min-w-[120px]"
    >
      Row
    </th>
  );

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 overflow-hidden bg-surface-container-lowest border border-surface-border rounded-lg shadow-sm m-4 transition-opacity ${
        isUpdating ? "opacity-70" : ""
      }`}
    >
      <div className="px-4 py-2 border-b border-surface-border bg-surface-container-low shrink-0">
        <h3 className="text-title-sm font-bold text-on-surface">Pivot View</h3>
        <p className="text-xs text-secondary mt-0.5">
          Target is summed once per store + month (not per category column). Sales &amp; SOH sum at
          cell level.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-left border-collapse font-data-tabular text-[13px] min-w-max">
          <thead className="bg-surface-container-low sticky top-0 z-10">
            <tr>
              {rowHeader}
              {hasColPivot
                ? grid.colKeys.map((colKey) => (
                    <th
                      key={colKey}
                      colSpan={metricCount}
                      className="p-2 border-r border-b border-surface-border font-semibold text-center bg-primary-fixed/20"
                    >
                      {colKey}
                    </th>
                  ))
                : pivot.values.map((metricId) => (
                    <th
                      key={metricId}
                      className="p-2 border-r border-b border-surface-border text-right font-semibold"
                    >
                      {getField(metricId)?.label ?? metricId}
                    </th>
                  ))}
            </tr>
            {hasColPivot && metricCount > 0 ? (
              <tr>
                {grid.colKeys.map((colKey) =>
                  pivot.values.map((metricId) => (
                    <th
                      key={`${colKey}-${metricId}`}
                      className="p-2 border-r border-b border-surface-border text-right font-medium text-secondary text-xs whitespace-nowrap"
                    >
                      {getField(metricId)?.label ?? metricId}
                    </th>
                  )),
                )}
              </tr>
            ) : null}
          </thead>

          <tbody className="divide-y divide-surface-border">
            {topSpacer > 0 ? (
              <tr aria-hidden>
                <td style={{ height: topSpacer, padding: 0, border: 0 }} colSpan={99} />
              </tr>
            ) : null}

            {visibleRowKeys.map((rowKey, index) => {
              const zebra = (start + index) % 2 === 1;

              return (
                <tr
                  key={rowKey}
                  className={`hover:bg-surface-variant ${zebra ? "bg-surface-bright/60" : ""}`}
                  style={{ height: ROW_HEIGHT_PX }}
                >
                  <td className="p-2 border-r border-surface-border sticky left-0 bg-inherit z-[1] whitespace-nowrap font-medium">
                    {rowKey}
                  </td>

                  {hasColPivot
                    ? grid.colKeys.map((colKey) => {
                        const cell = grid.getCell(rowKey, colKey);
                        return pivot.values.map((metricId) => (
                          <td
                            key={`${rowKey}-${colKey}-${metricId}`}
                            className="p-2 border-r border-surface-border text-right tabular-nums whitespace-nowrap"
                          >
                            {formatMetricValue(metricId, cell[metricId] ?? 0)}
                          </td>
                        ));
                      })
                    : pivot.values.map((metricId) => {
                        const cell = grid.getCell(rowKey, "Total");
                        return (
                          <td
                            key={metricId}
                            className="p-2 border-r border-surface-border text-right tabular-nums"
                          >
                            {formatMetricValue(metricId, cell[metricId] ?? 0)}
                          </td>
                        );
                      })}
                </tr>
              );
            })}

            {bottomSpacer > 0 ? (
              <tr aria-hidden>
                <td style={{ height: bottomSpacer, padding: 0, border: 0 }} colSpan={99} />
              </tr>
            ) : null}

            <tr className="bg-primary-fixed/30 font-bold border-t-2 border-primary sticky bottom-0">
              <td className="p-2 border-r border-surface-border sticky left-0 bg-primary-fixed/30 z-[1]">
                Grand Total
              </td>
              {hasColPivot
                ? grid.colKeys.map((colKey) =>
                    pivot.values.map((metricId) => (
                      <td
                        key={`total-${colKey}-${metricId}`}
                        className="p-2 border-r border-surface-border text-right tabular-nums"
                      >
                        {formatMetricValue(metricId, grid.colTotals[colKey]?.[metricId] ?? 0)}
                      </td>
                    )),
                  )
                : pivot.values.map((metricId) => (
                    <td
                      key={`total-${metricId}`}
                      className="p-2 border-r border-surface-border text-right tabular-nums"
                    >
                      {formatMetricValue(metricId, grid.grandTotal[metricId] ?? 0)}
                    </td>
                  ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-surface-border bg-surface-container-low text-xs text-secondary shrink-0 flex justify-between gap-4">
        <span>
          {formatNumber(grid.rowKeys.length)} rows × {formatNumber(grid.colKeys.length)} columns
        </span>
        <span>{formatNumber(rows.length)} detail rows in filter</span>
      </div>
    </div>
  );
});
