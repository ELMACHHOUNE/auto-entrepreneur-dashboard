import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useMemo } from 'react';

export type CategoryPoint = { name: string; count: number };

export default function UsersByCategoryChart({
  data,
  height = 320,
}: {
  data: CategoryPoint[];
  height?: number;
}) {
  const chartData = useMemo(() => data, [data]);
  return (
    <div className="w-full" style={{ minHeight: 300 }}>
      <ResponsiveContainer width="100%" height={height} debounce={150}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickMargin={8}
          />
          <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} width={40} />
          <Tooltip
            wrapperStyle={{ outline: 'none' }}
            contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          />
          <Legend wrapperStyle={{ color: 'var(--muted-foreground)', fontSize: 12 }} />
          <Bar dataKey="count" name="Users" fill="#0776c0" barSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
