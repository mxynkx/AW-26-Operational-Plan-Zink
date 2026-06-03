import { useMemo, type CSSProperties } from "react";
import { getField } from "../config/fields";
import { PINNED_COLUMNS, pinnedLeft } from "../config/pinnedColumns";
import {
  SEASON_COLUMNS,
  SIZE_COLUMNS,
  type PivotConfig,
  type PlanMeta,
  type SortDir,
  type SortKey,
  type TableRow,
} from "../types/plan";
import type { TableFilters } from "../types/tableFilters";
import { formatNumber } from "../utils/format";
import { buildPivotMatrix } from "../utils/pivot";
import { FilterTh, MultiSelectFilter, RangeFilter, TextFilter } from "./TableFilterCells";
import { Icon } from "./Icon";

interface DataTableProps {
  rows: TableRow[];
  allRowsCount: number;
  meta: PlanMeta;
  tableFilters: TableFilters;
  activeFilterCount: number;
  onTableFiltersChange: (filters: TableFilters) => void;
  onClearFilters: () => void;
  pivot: PivotConfig;
  sortKey: SortKey;
  sortDir: SortDir;
  page: number;
  pageSize: number;
  onSort: (key: SortKey) => void;
  onPageChange: (page: number) => void;
  showPivotSummary?: boolean;
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  sortDir,
  onSort,
  className = "",
  style,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
  style?: CSSProperties;
  align?: "left" | "right" | "center";
}) {
  const active = activeKey === sortKey;
  const alignClass =
    align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-between";

  return (
    <th className={className} style={style}>
      <button
        type="button"
        className={`flex items-center gap-1 w-full ${alignClass} hover:text-primary`}
        onClick={() => onSort(sortKey)}
      >
        {label}
        <Icon
          name={active ? (sortDir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
          className={`text-xs ${active ? "text-primary" : "text-secondary opacity-50"}`}
        />
      </button>
    </th>
  );
}

function pinnedStyle(index: number, width: number): CSSProperties {
  return {
    position: "sticky",
    left: pinnedLeft(index),
    width,
    minWidth: width,
    maxWidth: width,
  };
}

function pinnedHeaderClass(index: number) {
  const isLast = index === PINNED_COLUMNS.length - 1;
  return `border-b border-r border-surface-border p-2 bg-surface-container-low z-40 ${
    isLast ? "shadow-[4px_0_10px_-4px_rgba(25,28,30,0.18)]" : ""
  }`;
}

function pinnedBodyClass(index: number, striped: boolean) {
  const isLast = index === PINNED_COLUMNS.length - 1;
  return `border-r border-surface-border p-2 z-20 truncate ${
    striped ? "bg-surface-bright" : "bg-surface-container-lowest"
  } group-hover:bg-surface-variant ${isLast ? "shadow-[4px_0_10px_-4px_rgba(25,28,30,0.18)]" : ""}`;
}

function pinnedFilterClass(index: number) {
  const isLast = index === PINNED_COLUMNS.length - 1;
  return `z-30 bg-surface-container ${isLast ? "shadow-[4px_0_10px_-4px_rgba(25,28,30,0.18)]" : ""}`;
}

export function DataTable({
  rows,
  allRowsCount,
  meta,
  tableFilters,
  activeFilterCount,
  onTableFiltersChange,
  onClearFilters,
  pivot,
  sortKey,
  sortDir,
  page,
  pageSize,
  onSort,
  onPageChange,
  showPivotSummary = true,
}: DataTableProps) {
  const monthOptions = meta.dimensions.Month.map(String);

  function patchFilters(patch: Partial<TableFilters>) {
    onTableFiltersChange({ ...tableFilters, ...patch });
  }
  const pivotMatrix = useMemo(() => buildPivotMatrix(rows, pivot), [rows, pivot]);
  const hasPivotSummary =
    showPivotSummary && (pivot.rows.length > 0 || pivot.cols.length > 0);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const pivotRows = pivotMatrix.slice(0, 1000);

  return (
    <div className="flex-1 min-h-0 p-4 bg-background flex flex-col gap-4 overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col bg-surface-container-lowest border border-surface-border rounded-lg shadow-sm overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-container-low text-label-caps text-secondary gap-4 flex-wrap">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, rows.length)} of {formatNumber(rows.length)} rows
            {rows.length !== allRowsCount ? ` (filtered from ${formatNumber(allRowsCount)})` : ""}
          </span>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 ? (
              <button
                type="button"
                className="px-2 py-1 rounded border border-primary text-primary hover:bg-primary-fixed text-[11px]"
                onClick={onClearFilters}
              >
                Clear {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={page <= 1}
              className="px-2 py-1 rounded border border-surface-border disabled:opacity-40 hover:bg-surface-variant"
              onClick={() => onPageChange(page - 1)}
            >
              Prev
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              className="px-2 py-1 rounded border border-surface-border disabled:opacity-40 hover:bg-surface-variant"
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-left border-separate border-spacing-0 font-data-tabular text-[13px] min-w-[1900px] isolate">
            <thead className="bg-surface-container-low text-on-surface">
              <tr>
                {PINNED_COLUMNS.map((col, index) => (
                  <SortHeader
                    key={col.id}
                    label={col.label}
                    sortKey={col.sortKey}
                    activeKey={sortKey}
                    sortDir={sortDir}
                    onSort={onSort}
                    className={`${pinnedHeaderClass(index)} sticky top-0`}
                    style={pinnedStyle(index, col.width)}
                    align={col.align}
                  />
                ))}
                <SortHeader
                  label="Target"
                  sortKey="Target"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                  className="border-b border-r border-surface-border p-2 text-right"
                  align="right"
                />
                <SortHeader
                  label="Sales Units"
                  sortKey="Sales_Units"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                  className="border-b border-r border-surface-border p-2 text-right"
                  align="right"
                />
                <SortHeader
                  label="Total SOH Units"
                  sortKey="Total_SOH_Units"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                  className="border-b border-r border-surface-border p-2 text-right"
                  align="right"
                />
                <th
                  className="border-b border-r border-surface-border p-2 text-center bg-plan-sales font-bold"
                  colSpan={SIZE_COLUMNS.length}
                >
                  FINAL SALES UNITS PLAN
                </th>
                <th
                  className="border-b border-r border-surface-border p-2 text-center bg-plan-soh font-bold"
                  colSpan={SIZE_COLUMNS.length}
                >
                  FINAL SOH UNITS PLAN
                </th>
                <th
                  className="border-b border-r border-surface-border p-2 text-center bg-plan-season font-bold"
                  colSpan={SEASON_COLUMNS.length}
                >
                  Season Wise Sales plan
                </th>
                <th
                  className="border-b border-r border-surface-border p-2 text-center bg-plan-season-soh font-bold"
                  colSpan={SEASON_COLUMNS.length}
                >
                  Season Wise SOH plan
                </th>
              </tr>
              <tr>
                {PINNED_COLUMNS.map((col, index) => (
                  <th
                    key={`sub-${col.id}`}
                    className={`border-b border-r border-surface-border p-2 sticky top-0 ${pinnedHeaderClass(index)}`}
                    style={pinnedStyle(index, col.width)}
                  />
                ))}
                <th className="border-b border-r border-surface-border p-2 sticky top-0 bg-surface-container-low z-10" colSpan={3} />
                {SIZE_COLUMNS.map((size) => (
                  <th
                    key={`sales-${size}`}
                    className="border-b border-r border-surface-border p-2 text-center bg-plan-sales/50"
                  >
                    {size}
                  </th>
                ))}
                {SIZE_COLUMNS.map((size) => (
                  <th
                    key={`soh-${size}`}
                    className="border-b border-r border-surface-border p-2 text-center bg-plan-soh/50"
                  >
                    {size}
                  </th>
                ))}
                {SEASON_COLUMNS.map((season) => (
                  <th
                    key={`season-sales-${season}`}
                    className="border-b border-r border-surface-border p-2 text-center bg-plan-season/50"
                  >
                    {season}
                  </th>
                ))}
                {SEASON_COLUMNS.map((season) => (
                  <th
                    key={`season-soh-${season}`}
                    className="border-b border-r border-surface-border p-2 text-center bg-plan-season-soh/50"
                  >
                    {season}
                  </th>
                ))}
              </tr>
              <tr className="bg-surface-container">
                <FilterTh
                  className={pinnedFilterClass(0)}
                  style={pinnedStyle(0, PINNED_COLUMNS[0].width)}
                >
                  <TextFilter
                    value={tableFilters.Tag}
                    onChange={(Tag) => patchFilters({ Tag })}
                    placeholder="Tag…"
                  />
                </FilterTh>
                <FilterTh
                  className={pinnedFilterClass(1)}
                  style={pinnedStyle(1, PINNED_COLUMNS[1].width)}
                >
                  <MultiSelectFilter
                    options={meta.dimensions.Site_Code}
                    selected={tableFilters.Site_Code}
                    onChange={(Site_Code) => patchFilters({ Site_Code })}
                  />
                </FilterTh>
                <FilterTh
                  className={pinnedFilterClass(2)}
                  style={pinnedStyle(2, PINNED_COLUMNS[2].width)}
                >
                  <MultiSelectFilter
                    options={monthOptions}
                    selected={tableFilters.Month}
                    onChange={(Month) => patchFilters({ Month })}
                  />
                </FilterTh>
                <FilterTh
                  className={pinnedFilterClass(3)}
                  style={pinnedStyle(3, PINNED_COLUMNS[3].width)}
                >
                  <MultiSelectFilter
                    options={meta.dimensions.Grade}
                    selected={tableFilters.Grade}
                    onChange={(Grade) => patchFilters({ Grade })}
                  />
                </FilterTh>
                <FilterTh
                  className={pinnedFilterClass(4)}
                  style={pinnedStyle(4, PINNED_COLUMNS[4].width)}
                >
                  <MultiSelectFilter
                    options={meta.dimensions.Category}
                    selected={tableFilters.Category}
                    onChange={(Category) => patchFilters({ Category })}
                  />
                </FilterTh>
                <FilterTh>
                  <RangeFilter
                    range={tableFilters.Target}
                    onChange={(Target) => patchFilters({ Target })}
                  />
                </FilterTh>
                <FilterTh>
                  <RangeFilter
                    range={tableFilters.Sales_Units}
                    onChange={(Sales_Units) => patchFilters({ Sales_Units })}
                  />
                </FilterTh>
                <FilterTh>
                  <RangeFilter
                    range={tableFilters.Total_SOH_Units}
                    onChange={(Total_SOH_Units) => patchFilters({ Total_SOH_Units })}
                  />
                </FilterTh>
                {SIZE_COLUMNS.map((size) => (
                  <FilterTh key={`filter-sales-${size}`} className="bg-plan-sales/30">
                    <RangeFilter
                      range={tableFilters.Sales_By_Size[size]}
                      onChange={(range) =>
                        patchFilters({
                          Sales_By_Size: { ...tableFilters.Sales_By_Size, [size]: range },
                        })
                      }
                    />
                  </FilterTh>
                ))}
                {SIZE_COLUMNS.map((size) => (
                  <FilterTh key={`filter-soh-${size}`} className="bg-plan-soh/30">
                    <RangeFilter
                      range={tableFilters.SOH_By_Size[size]}
                      onChange={(range) =>
                        patchFilters({
                          SOH_By_Size: { ...tableFilters.SOH_By_Size, [size]: range },
                        })
                      }
                    />
                  </FilterTh>
                ))}
                {SEASON_COLUMNS.map((season) => (
                  <FilterTh key={`filter-season-sales-${season}`} className="bg-plan-season/30">
                    <RangeFilter
                      range={tableFilters.Season_Sales[season]}
                      onChange={(range) =>
                        patchFilters({
                          Season_Sales: { ...tableFilters.Season_Sales, [season]: range },
                        })
                      }
                    />
                  </FilterTh>
                ))}
                {SEASON_COLUMNS.map((season) => (
                  <FilterTh key={`filter-season-soh-${season}`} className="bg-plan-season-soh/30">
                    <RangeFilter
                      range={tableFilters.Season_SOH[season]}
                      onChange={(range) =>
                        patchFilters({
                          Season_SOH: { ...tableFilters.Season_SOH, [season]: range },
                        })
                      }
                    />
                  </FilterTh>
                ))}
              </tr>
            </thead>
            <tbody className="bg-surface-container-lowest divide-y divide-surface-border">
              {pageRows.map((row, index) => (
                <tr
                  key={`${row.Tag}-${index}`}
                  className={`hover:bg-surface-variant transition-colors group ${
                    index % 2 === 1 ? "bg-surface-bright" : ""
                  }`}
                >
                  {PINNED_COLUMNS.map((col, colIndex) => (
                    <td
                      key={col.id}
                      className={`${pinnedBodyClass(colIndex, index % 2 === 1)} ${
                        col.align === "center" ? "text-center" : ""
                      }`}
                      style={pinnedStyle(colIndex, col.width)}
                    >
                      {String(row[col.sortKey] ?? "")}
                    </td>
                  ))}
                  <td className="border-r border-surface-border p-2 text-right">{formatNumber(row.Target)}</td>
                  <td className="border-r border-surface-border p-2 text-right">{formatNumber(row.Sales_Units)}</td>
                  <td className="border-r border-surface-border p-2 text-right">{formatNumber(row.Total_SOH_Units)}</td>
                  {SIZE_COLUMNS.map((size) => (
                    <td
                      key={`sales-${row.Tag}-${size}`}
                      className="border-r border-surface-border p-2 text-right bg-plan-sales/20"
                    >
                      {formatNumber(row.Sales_By_Size[size])}
                    </td>
                  ))}
                  {SIZE_COLUMNS.map((size) => (
                    <td
                      key={`soh-${row.Tag}-${size}`}
                      className="border-r border-surface-border p-2 text-right bg-plan-soh/20"
                    >
                      {formatNumber(row.SOH_By_Size[size])}
                    </td>
                  ))}
                  {SEASON_COLUMNS.map((season) => (
                    <td
                      key={`season-sales-${row.Tag}-${season}`}
                      className="border-r border-surface-border p-2 text-right bg-plan-season/20"
                    >
                      {formatNumber(row.Season_Sales[season])}
                    </td>
                  ))}
                  {SEASON_COLUMNS.map((season) => (
                    <td
                      key={`season-soh-${row.Tag}-${season}`}
                      className="border-r border-surface-border p-2 text-right bg-plan-season-soh/20"
                    >
                      {formatNumber(row.Season_SOH[season])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasPivotSummary && pivot.values.length > 0 ? (
        <div className="bg-surface-container-lowest border border-surface-border rounded-lg shadow-sm overflow-hidden shrink-0">
          <div className="px-4 py-2 border-b border-surface-border bg-surface-container-low flex items-center justify-between">
            <h3 className="text-title-sm font-bold text-on-surface">Pivot Summary</h3>
            <span className="text-label-caps text-secondary">
              {formatNumber(pivotRows.length)} of {formatNumber(pivotMatrix.length)} groups
            </span>
          </div>
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left border-collapse font-data-tabular text-[13px]">
              <thead className="bg-surface-container-low sticky top-0 z-10">
                <tr>
                  {pivot.rows.length > 0 ? <th className="p-2 border-r border-surface-border">Row</th> : null}
                  {pivot.cols.length > 0 ? <th className="p-2 border-r border-surface-border">Column</th> : null}
                  {pivot.values.map((metricId) => (
                    <th key={metricId} className="p-2 border-r border-surface-border text-right">
                      {getField(metricId)?.label ?? metricId}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {pivotRows.map((cell) => (
                  <tr key={`${cell.rowKey}-${cell.colKey}`} className="hover:bg-surface-variant">
                    {pivot.rows.length > 0 ? <td className="p-2 border-r border-surface-border">{cell.rowKey}</td> : null}
                    {pivot.cols.length > 0 ? <td className="p-2 border-r border-surface-border">{cell.colKey}</td> : null}
                    {pivot.values.map((metricId) => (
                      <td key={metricId} className="p-2 border-r border-surface-border text-right">
                        {formatNumber(cell.values[metricId] ?? 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
