import { useMemo, useState } from "react";
import { dimLabel } from "../utils/dimensions";
import { buildSummaryTable } from "../utils/summaryTable";
import { formatCompactCurrency, formatNumber, formatPercent } from "../utils/format";
import type { TableRow } from "../types/plan";
import type { DimKey } from "../types/planFilters";

interface SummaryTableProps {
  rows: TableRow[];
}

function cellKey(rowKey: string | number, colKey: string | number): string {
  return `${rowKey}\0${colKey}`;
}

export function SummaryTable({ rows }: SummaryTableProps) {
  const [rowDim, setRowDim] = useState<DimKey>("cat");
  const [colDim, setColDim] = useState<DimKey>("mo");

  const table = useMemo(() => buildSummaryTable(rows, rowDim, colDim), [rows, rowDim, colDim]);

  return (
    <div className="bg-surface-container-lowest border-[1.5px] border-surface-border rounded-lg shadow-sm flex flex-col flex-1 min-h-[220px] overflow-hidden">
      <div className="flex items-center flex-wrap gap-2 px-3.5 py-2.5 border-b border-surface-border bg-surface-container-low shrink-0">
        <span className="text-[12.5px] font-bold text-on-surface">Summary Table</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-secondary font-medium">Rows</span>
          <select
            className="bg-white border-[1.5px] border-surface-border rounded px-2 py-1 text-[12px] font-medium outline-none cursor-pointer"
            value={rowDim}
            onChange={(e) => setRowDim(e.target.value as DimKey)}
          >
            <option value="cat">Category</option>
            <option value="gr">Grade</option>
            <option value="mo">Month</option>
            <option value="st">Store</option>
          </select>
          <span className="text-[11px] text-secondary">×</span>
          <select
            className="bg-white border-[1.5px] border-surface-border rounded px-2 py-1 text-[12px] font-medium outline-none cursor-pointer"
            value={colDim}
            onChange={(e) => setColDim(e.target.value as DimKey)}
          >
            <option value="mo">Month</option>
            <option value="cat">Category</option>
            <option value="gr">Grade</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>

      <div className="aw26-scroll-panel">
        <table className="aw26-data-table text-[12px] min-w-max">
          <thead className="sticky top-0 z-10 bg-surface-container-low">
            {colDim === "none" ? (
              <tr>
                <th className="p-2 text-left text-[10.5px] font-bold text-secondary border-b border-surface-border sticky left-0 z-[11] bg-surface-container-low">
                  {rowDim.toUpperCase()}
                </th>
                <th className="p-2 text-right text-[10.5px] font-bold text-secondary border-b border-surface-border">
                  Sales
                </th>
                <th className="p-2 text-right text-[10.5px] font-bold text-secondary border-b border-surface-border">
                  SOH
                </th>
                <th className="p-2 text-right text-[10.5px] font-bold text-secondary border-b border-surface-border">
                  ST%
                </th>
                <th className="p-2 text-right text-[10.5px] font-bold text-secondary border-b border-surface-border">
                  Target
                </th>
              </tr>
            ) : (
              <>
                <tr>
                  <th
                    rowSpan={2}
                    className="p-2 text-left text-[10.5px] font-bold text-secondary border-b border-surface-border sticky left-0 z-[11] bg-surface-container-low"
                  >
                    {rowDim.toUpperCase()}
                  </th>
                  {table.colKeys.map((ck) => (
                    <th
                      key={String(ck)}
                      colSpan={3}
                      className="p-2 text-center text-[10.5px] font-bold text-secondary border-b border-surface-border border-l-2 border-l-surface-border"
                    >
                      {dimLabel(ck, colDim)}
                    </th>
                  ))}
                </tr>
                <tr>
                  {table.colKeys.map((ck, ci) => (
                    <MetricSubHeaders key={String(ck)} first={ci === 0} />
                  ))}
                </tr>
              </>
            )}
          </thead>
          <tbody>
            {table.rowKeys.map((rk) => {
              const rowCells =
                colDim === "none"
                  ? table.cells.get(cellKey(rk, "_"))
                  : null;
              const st =
                rowCells && rowCells.soh > 0 ? rowCells.sales / rowCells.soh : 0;

              return (
                <tr key={String(rk)} className="hover:bg-surface-container-low">
                  <td className="p-2 text-left font-semibold text-[12px] border-b border-surface-border sticky left-0 z-[1] bg-inherit shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                    {dimLabel(rk, rowDim)}
                  </td>
                  {colDim === "none" && rowCells ? (
                    <>
                      <td className="p-2 text-right font-data-tabular text-[11px] border-b border-surface-border">
                        {formatNumber(rowCells.sales)}
                      </td>
                      <td className="p-2 text-right font-data-tabular text-[11px] border-b border-surface-border">
                        {formatNumber(rowCells.soh)}
                      </td>
                      <td className="p-2 text-right font-data-tabular text-[11px] border-b border-surface-border">
                        {formatPercent(st * 100)}
                      </td>
                      <td className="p-2 text-right font-data-tabular text-[11px] border-b border-surface-border">
                        {formatCompactCurrency(rowCells.target)}
                      </td>
                    </>
                  ) : (
                    table.colKeys.map((ck, ci) => {
                      const c = table.cells.get(cellKey(rk, ck)) ?? {
                        sales: 0,
                        soh: 0,
                        target: 0,
                      };
                      const st2 = c.soh > 0 ? c.sales / c.soh : 0;
                      const bl = ci > 0 ? "border-l-2 border-l-surface-border" : "";
                      return (
                        <td
                          key={String(ck)}
                          colSpan={3}
                          className={`p-0 border-b border-surface-border ${bl}`}
                        >
                          <div className="grid grid-cols-3">
                            <span className="p-2 text-right font-data-tabular text-[11px]">
                              {formatNumber(c.sales)}
                            </span>
                            <span className="p-2 text-right font-data-tabular text-[11px]">
                              {formatNumber(c.soh)}
                            </span>
                            <span className="p-2 text-right font-data-tabular text-[11px]">
                              {formatPercent(st2 * 100)}
                            </span>
                          </div>
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="aw26-table-foot">
              <td className="p-2 text-left font-bold text-[12px] sticky left-0 bottom-0 z-[12] aw26-table-foot">TOTAL</td>
              {colDim === "none" ? (
                <>
                  <td className="p-2 text-right font-data-tabular font-bold text-[11px]">
                    {formatNumber(table.grand.sales)}
                  </td>
                  <td className="p-2 text-right font-data-tabular font-bold text-[11px]">
                    {formatNumber(table.grand.soh)}
                  </td>
                  <td className="p-2 text-right font-data-tabular font-bold text-[11px]">
                    {formatPercent(table.grand.sellThrough * 100)}
                  </td>
                  <td className="p-2 text-right font-data-tabular font-bold text-[11px]">
                    {formatCompactCurrency(table.grand.target)}
                  </td>
                </>
              ) : (
                table.colKeys.map((ck, ci) => {
                  const t = table.colTotals.get(ck)!;
                  const bl = ci > 0 ? "border-l-2 border-l-white/20" : "";
                  return (
                    <td key={String(ck)} colSpan={3} className={`p-0 ${bl}`}>
                      <div className="grid grid-cols-3">
                        <span className="p-2 text-right font-data-tabular font-bold text-[11px]">
                          {formatNumber(t.sales)}
                        </span>
                        <span className="p-2 text-right font-data-tabular font-bold text-[11px]">
                          {formatNumber(t.soh)}
                        </span>
                        <span className="p-2 text-right font-data-tabular font-bold text-[11px]">
                          {formatPercent(t.sellThrough * 100)}
                        </span>
                      </div>
                    </td>
                  );
                })
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function MetricSubHeaders({ first }: { first: boolean }) {
  const bl = first ? "" : "border-l-2 border-l-surface-border";
  return (
    <>
      <th
        className={`p-1.5 text-right text-[10px] font-semibold text-white/90 bg-[#1a5c8a] ${bl}`}
      >
        Sales
      </th>
      <th className="p-1.5 text-right text-[10px] font-semibold text-white/90 bg-[#1a4f6b]">SOH</th>
      <th className="p-1.5 text-right text-[10px] font-semibold text-white/90 bg-[#1a4a3a]">ST%</th>
    </>
  );
}
