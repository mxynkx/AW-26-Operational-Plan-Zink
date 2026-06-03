import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber } from "../utils/format";

export interface DonutSlice {
  name: string;
  value: number;
  percent: number;
}

interface ChartsPanelProps {
  categorySoh: DonutSlice[];
  sizeSoh: DonutSlice[];
  seasonSoh: DonutSlice[];
}

const CHART_HEIGHT = 200;
const INNER_RADIUS = 58;
const OUTER_RADIUS = 82;

const CATEGORY_COLORS = ["#2c5be8", "#0f9f6e", "#d97706", "#e8481e", "#7c3aed"];
const SIZE_COLORS = ["#1d4ed8", "#0369a1", "#0891b2", "#059669", "#65a30d", "#ca8a04"];
const SEASON_COLORS = ["#e8481e", "#d97706", "#2c5be8", "#0f9f6e"];

function DonutChart({
  data,
  colors,
  chartKey,
}: {
  data: DonutSlice[];
  colors: string[];
  chartKey: string;
}) {
  const hasValues = data.some((d) => d.value > 0);

  if (!hasValues) {
    return (
      <div
        className="flex items-center justify-center text-secondary text-sm"
        style={{ height: CHART_HEIGHT }}
      >
        No data for current filters
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <PieChart key={chartKey}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={INNER_RADIUS}
          outerRadius={OUTER_RADIUS}
          paddingAngle={2}
          isAnimationActive={false}
        >
          {data.map((item, index) => (
            <Cell
              key={item.name}
              fill={colors[index % colors.length]}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => [formatNumber(v), "Units"]}
          contentStyle={{
            background: "#fff",
            border: "1px solid var(--color-surface-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ChartLegend({
  data,
  colors,
}: {
  data: DonutSlice[];
  colors: string[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="flex flex-col gap-2 text-[11px] text-secondary w-[148px] min-w-[148px] shrink-0">
      {data.map((d, i) => (
        <div key={d.name} className="flex items-start gap-2 leading-snug">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: colors[i % colors.length] }}
          />
          <span className="whitespace-normal break-words">
            {d.name}{" "}
            <span className="font-semibold text-on-surface tabular-nums">
              {Math.round((d.value / total) * 100)}%
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutCard({
  title,
  subtitle,
  data,
  colors,
  chartKey,
}: {
  title: string;
  subtitle: string;
  data: DonutSlice[];
  colors: string[];
  chartKey: string;
}) {
  return (
    <div className="bg-surface-container-lowest border-[1.5px] border-surface-border rounded-lg p-4 shadow-sm flex flex-col min-w-0">
      <h3 className="text-[13px] font-bold text-on-surface mb-0.5">{title}</h3>
      <p className="text-[11px] text-secondary mb-3">{subtitle}</p>
      <div className="flex items-center gap-2 min-w-0" style={{ minHeight: CHART_HEIGHT }}>
        <div className="flex-1 min-w-0" style={{ height: CHART_HEIGHT }}>
          <DonutChart data={data} colors={colors} chartKey={chartKey} />
        </div>
        <ChartLegend data={data} colors={colors} />
      </div>
    </div>
  );
}

export function ChartsPanel({ categorySoh, sizeSoh, seasonSoh }: ChartsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 shrink-0">
      <DonutCard
        title="Category Contribution"
        subtitle="SOH Units by Category"
        data={categorySoh}
        colors={CATEGORY_COLORS}
        chartKey="category-soh"
      />
      <DonutCard
        title="Size Curve"
        subtitle="SOH Units by Size"
        data={sizeSoh}
        colors={SIZE_COLORS}
        chartKey="size-soh"
      />
      <DonutCard
        title="SOH by Season"
        subtitle="Older / CS-1 / CS / CS+1"
        data={seasonSoh}
        colors={SEASON_COLORS}
        chartKey="season-soh"
      />
    </div>
  );
}
