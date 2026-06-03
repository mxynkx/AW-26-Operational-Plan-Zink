import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber } from "../utils/format";

export interface DonutSlice {
  name: string;
  value: number;
  percent: number;
}

interface ChartsPanelProps {
  sizeData: DonutSlice[];
  categoryData: DonutSlice[];
}

const SIZE_COLORS = ["#2563eb", "#3b82f6", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#94a3b8"];
const CATEGORY_COLORS = ["#2563eb", "#6366F1", "#0ea5e9", "#b4c5ff", "#94a3b8"];

function DonutCard({
  title,
  data,
  colors,
}: {
  title: string;
  data: DonutSlice[];
  colors: string[];
}) {
  return (
    <div className="bg-surface-container-lowest border border-surface-border rounded-lg p-4 shadow-sm flex flex-col min-h-[280px]">
      <h3 className="text-title-sm font-bold text-on-surface mb-4">{title}</h3>
      <div className="flex flex-1 flex-col sm:flex-row items-center justify-center gap-6">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={64}
              paddingAngle={2}
            >
              {data.map((item, index) => (
                <Cell key={item.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, _n, props) => [
                `${formatNumber(v)} (${(props.payload as DonutSlice).percent.toFixed(1)}%)`,
                "Units",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 text-data-tabular text-[13px] max-h-[160px] overflow-y-auto">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span>
                {item.name} ({item.percent.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChartsPanel({ sizeData, categoryData }: ChartsPanelProps) {
  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 border-b border-surface-border bg-surface-container-low shrink-0">
      <DonutCard title="Sales Units by Size" data={sizeData} colors={SIZE_COLORS} />
      <DonutCard title="Category Contribution" data={categoryData} colors={CATEGORY_COLORS} />
    </div>
  );
}
