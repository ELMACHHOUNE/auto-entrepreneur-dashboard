import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export type QuarterKey = 'T1' | 'T2' | 'T3' | 'T4';

export interface QuarterLinePoint {
  name: string; // e.g., month label
  T1: number;
  T2: number;
  T3: number;
  T4: number;
}

export interface QuarterLinesChartUIProps {
  data: QuarterLinePoint[];
  height?: number;
  showLegend?: boolean;
  colors?: Partial<Record<QuarterKey, string>>;
  valueFormatter?: (value: number) => string;
  animate?: boolean; // disable animations by default for smoother layout resizes
}

const defaultColors: Record<QuarterKey, string> = {
  T1: '#3b82f6', // blue-500
  T2: '#10b981', // emerald-500
  T3: '#f59e0b', // amber-500
  T4: '#ef4444', // red-500
};

export const QuarterLinesChartUI: React.FC<QuarterLinesChartUIProps> = ({
  data,
  height = 280,
  showLegend = true,
  colors = defaultColors,
  valueFormatter,
  animate = false,
}) => {
  const format =
    valueFormatter ||
    ((n: number) =>
      new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        n || 0
      ));
  return (
    <div className="w-full h-full" style={{ minHeight: 180 }}>
      <ResponsiveContainer width="100%" height={height} debounce={150}>
        <LineChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis width={50} tickFormatter={(v: number) => format(Number(v))} />
          <Tooltip
            formatter={(value: unknown, name: string) => [
              format(typeof value === 'number' ? value : Number(value)),
              name,
            ]}
          />
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey="T1"
            stroke={colors.T1 || defaultColors.T1}
            strokeWidth={2}
            dot={false}
            isAnimationActive={animate}
            animationDuration={animate ? 300 : 0}
          />
          <Line
            type="monotone"
            dataKey="T2"
            stroke={colors.T2 || defaultColors.T2}
            strokeWidth={2}
            dot={false}
            isAnimationActive={animate}
            animationDuration={animate ? 300 : 0}
          />
          <Line
            type="monotone"
            dataKey="T3"
            stroke={colors.T3 || defaultColors.T3}
            strokeWidth={2}
            dot={false}
            isAnimationActive={animate}
            animationDuration={animate ? 300 : 0}
          />
          <Line
            type="monotone"
            dataKey="T4"
            stroke={colors.T4 || defaultColors.T4}
            strokeWidth={2}
            dot={false}
            isAnimationActive={animate}
            animationDuration={animate ? 300 : 0}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(QuarterLinesChartUI);
