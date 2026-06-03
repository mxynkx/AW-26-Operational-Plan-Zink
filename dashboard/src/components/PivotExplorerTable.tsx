import { useDeferredValue, useMemo } from "react";
import { dimLabel } from "../utils/dimensions";
import { buildPivotBodyRows, sellThrough } from "../utils/pivotExplorerBody";
import type { PivotExplorerCell, PivotMetric } from "../utils/pivotExplorer";
import { formatCompactCurrency, formatNumber, formatPercent } from "../utils/format";
import type { TableRow } from "../types/plan";
import type { PivotExplorerConfig } from "../types/planFilters";

interface PivotExplorerTableProps {
  rows: TableRow[];
  config: PivotExplorerConfig;
}

const METRIC_BG: Record<string, string> = {
  sa: "bg-[#2c5be8]/[0.025]",
  so: "bg-cyan-600/[0.025]",
  tg: "bg-amber-600/[0.025]",
  st: "bg-emerald-700/[0.025]",
};

const METRIC_HEAD: Record<string, string> = {
  sa: "bg-[#1a5c8a] text-white/90",
  so: "bg-[#1a4f6b] text-white/90",
  tg: "bg-[#3d2e0a] text-white/90",
  st: "bg-[#1a4a3a] text-white/90",
};

const METRIC_TOT: Record<string, string> = {
  sa: "bg-[#1a5c8a] text-white/85",
  so: "bg-[#1a4f6b] text-white/85",
  tg: "bg-[#2a1f05] text-white/85",
  st: "bg-[#1a4a3a] text-white/85",
};

function cellText(metric: PivotMetric, cell: PivotExplorerCell, st: number): string {
  if (metric.key === "sales") return cell.sales ? formatNumber(cell.sales) : "–";
  if (metric.key === "soh") return cell.soh ? formatNumber(cell.soh) : "–";
  if (metric.key === "target") return cell.target ? formatCompactCurrency(cell.target) : "–";
  return cell.soh ? formatPercent(st * 100) : "–";
}

export function PivotExplorerTable({ rows, config }: PivotExplorerTableProps) {
  const deferredConfig = useDeferredValue(config);
  const built = useMemo(() => buildPivotBodyRows(rows, deferredConfig), [rows, deferredConfig]);

  if (!built) {
    return (
      <div className="aw26-scroll-panel flex items-center justify-center text-secondary text-sm p-8">
        Select at least one metric to display.
      </div>
    );
  }

  const { result, body } = built;
  const { metrics, colKeys, hasRow2, hasCol, grand, colGrand, config: cfg } = {
    metrics: result.metrics,
    colKeys: result.colKeys,
    hasRow2: result.hasRow2,
    hasCol: result.hasCol,
    grand: result.grand,
    colGrand: result.colGrand,
    config: deferredConfig,
  };
  const mc = metrics.length;
  const rspan = hasRow2 ? 2 : 1;

  return (
    <div className="aw26-scroll-panel px-4 py-3">
      <div className="aw26-scroll-inner bg-surface-container-lowest border-[1.5px] border-surface-border rounded-lg shadow-sm inline-block min-w-full">
        <table className="aw26-data-table aw26-pivot-table text-[12px] min-w-max">
          <thead className="sticky top-0 z-20">
            <tr>
              <th rowSpan={2} className="aw26-pivot-hg aw26-pivot-pin-h1 text-left align-middle">
                {result.row1Label}
              </th>
              {hasRow2 ? (
                <th rowSpan={2} className="aw26-pivot-hg aw26-pivot-pin-h2 text-left align-middle">
                  {result.row2Label}
                </th>
              ) : null}
              {hasCol ? (
                colKeys.map((kc) => (
                  <th key={String(kc)} colSpan={mc} className="aw26-pivot-hg text-center border-l border-white/15">
                    {dimLabel(kc, cfg.col)}
                  </th>
                ))
              ) : (
                <th colSpan={mc} className="aw26-pivot-hg text-center">
                  All
                </th>
              )}
              <th colSpan={mc} className="aw26-pivot-hg text-center border-l-[3px] border-white/25">
                TOTAL
              </th>
            </tr>
            <tr>
              {(hasCol ? colKeys : ["__"]).map((kc, ci) => (
                <MetricHeaders key={String(kc)} metrics={metrics} leftBorder={ci > 0} />
              ))}
              <MetricHeaders metrics={metrics} leftBorder strong />
            </tr>
          </thead>
          <tbody>
            {body.map((row, idx) => (
              <tr
                key={`${row.kind}-${row.row1Key}-${idx}`}
                className={row.groupBorder ? "border-t-2 border-surface-border" : ""}
              >
                {hasRow2 ? (
                  row.showRow1 ? (
                    <td rowSpan={row.row1RowSpan} className="aw26-pivot-rh aw26-pivot-pin-1 align-top">
                      {row.row1Label}
                    </td>
                  ) : null
                ) : (
                  <td className="aw26-pivot-rh aw26-pivot-pin-1">{row.row1Label}</td>
                )}
                {hasRow2 ? (
                  <td
                    className={`aw26-pivot-pin-2 ${
                      row.kind === "subtotal" ? "aw26-pivot-rh-stl" : "aw26-pivot-rh-sub"
                    }`}
                  >
                    {row.row2Label}
                  </td>
                ) : null}
                {row.colCells.map((cell, ci) => (
                  <MetricCells
                    key={ci}
                    metrics={metrics}
                    cell={cell}
                    st={sellThrough(cell)}
                    shaded={row.kind === "subtotal"}
                    leftBorder={ci > 0}
                  />
                ))}
                <MetricCells
                  metrics={metrics}
                  cell={row.rowTotal}
                  st={row.rowTotal.st}
                  shaded={row.kind === "subtotal"}
                  leftBorder
                  strong
                />
              </tr>
            ))}
            <tr>
              <td colSpan={rspan} className="aw26-pivot-rh-tot aw26-pivot-pin-tot">
                GRAND TOTAL
              </td>
              {hasCol ? (
                colKeys.map((kc, ci) => (
                  <MetricCells
                    key={String(kc)}
                    metrics={metrics}
                    cell={colGrand.get(kc)!}
                    st={colGrand.get(kc)!.st}
                    total
                    leftBorder={ci > 0}
                  />
                ))
              ) : (
                <MetricCells metrics={metrics} cell={grand} st={grand.st} total />
              )}
              <MetricCells metrics={metrics} cell={grand} st={grand.st} total strong />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-secondary mt-2 text-right px-1">{result.info}</p>
    </div>
  );
}

function MetricHeaders({
  metrics,
  leftBorder,
  strong,
}: {
  metrics: PivotMetric[];
  leftBorder?: boolean;
  strong?: boolean;
}) {
  return (
    <>
      {metrics.map((m) => (
        <th
          key={m.key}
          className={`px-2.5 py-1.5 text-[10px] font-semibold text-right ${METRIC_HEAD[m.css]} ${
            leftBorder ? (strong ? "border-l-[3px] border-white/20" : "border-l border-white/10") : ""
          }`}
        >
          {m.label}
        </th>
      ))}
    </>
  );
}

function MetricCells({
  metrics,
  cell,
  st,
  shaded,
  total,
  leftBorder,
  strong,
}: {
  metrics: PivotMetric[];
  cell: PivotExplorerCell;
  st: number;
  shaded?: boolean;
  total?: boolean;
  leftBorder?: boolean;
  strong?: boolean;
}) {
  return (
    <>
      {metrics.map((m) => (
        <td
          key={m.key}
          className={`px-2.5 py-1.5 text-right font-data-tabular text-[11.5px] border-b border-surface-border whitespace-nowrap ${
            total ? `font-bold ${METRIC_TOT[m.css]}` : METRIC_BG[m.css]
          } ${shaded && !total ? "bg-surface-container-low" : ""} ${
            leftBorder ? (strong ? "border-l-[3px] border-surface-border" : "border-l-2 border-surface-border") : ""
          }`}
        >
          {cellText(m, cell, st)}
        </td>
      ))}
    </>
  );
}
