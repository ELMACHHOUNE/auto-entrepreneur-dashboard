import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
} from 'recharts';
import { useMemo } from 'react';

export type YearPoint = { name: string; count: number };

const nf = new Intl.NumberFormat('en-US');

type TooltipPayloadItem = { name?: string; value?: number; color?: string };
function YearlyTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const barItem = payload.find(p => (p.name || '').toLowerCase() === 'signups');
  if (!barItem) return null;
  return (
    <div
      className="rounded-md border bg-card px-3 py-2 text-sm shadow-sm"
      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
    >
      <div className="mb-1 font-semibold">Year {label}</div>
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-[2px]"
          style={{ background: barItem.color || 'var(--success)' }}
        />
        <span>
          Signups: <strong className="tabular-nums">{nf.format(Number(barItem.value || 0))}</strong>
        </span>
      </div>
    </div>
  );
}

export default function YearlySignupsChart({
  data,
  height = 320,
}: {
  data: YearPoint[];
  height?: number;
}) {
  // Memoize data to avoid re-renders in Recharts from referential changes
  const chartData = useMemo(() => data, [data]);
  return (
    <div className="w-full" style={{ minHeight: 300 }}>
      <ResponsiveContainer width="100%" height={height} debounce={150}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
          barCategoryGap="35%"
        >
          <CartesianGrid stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickMargin={8}
          />
          <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} width={40} />
          <Tooltip wrapperStyle={{ outline: 'none' }} content={<YearlyTooltip />} />
          <Legend
            wrapperStyle={{ color: 'var(--muted-foreground)', fontSize: 12 }}
            formatter={(value: string, entry: { type?: string }) =>
              entry?.type === 'none' ? '' : String(value)
            }
          />
          <Bar dataKey="count" name="Signups" fill="var(--success)" barSize={22} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            legendType="none"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
