import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
    <div className="w-full h-full" style={{ minHeight: 220 }}>
      <ResponsiveContainer width="100%" height={height} debounce={150}>
        <LineChart data={data} margin={{ top: 6, right: 16, left: 16, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            interval={0}
            tickMargin={12}
            angle={-30}
            textAnchor="end"
            height={36}
          />
          <YAxis width={72} tickMargin={6} tickFormatter={(v: number) => format(Number(v))} />
          <Tooltip
            formatter={(value: unknown, name: string) => [
              format(typeof value === 'number' ? value : Number(value)),
              name,
            ]}
          />
          {/* Built-in Legend removed; we render a custom legend below */}
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
      {showLegend && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span
              style={{
                width: 12,
                height: 2,
                background: colors.T1 || defaultColors.T1,
                display: 'inline-block',
              }}
            />{' '}
            T1
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              style={{
                width: 12,
                height: 2,
                background: colors.T2 || defaultColors.T2,
                display: 'inline-block',
              }}
            />{' '}
            T2
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              style={{
                width: 12,
                height: 2,
                background: colors.T3 || defaultColors.T3,
                display: 'inline-block',
              }}
            />{' '}
            T3
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              style={{
                width: 12,
                height: 2,
                background: colors.T4 || defaultColors.T4,
                display: 'inline-block',
              }}
            />{' '}
            T4
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(QuarterLinesChartUI);
