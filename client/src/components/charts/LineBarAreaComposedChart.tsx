import React, { memo, useCallback, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Scatter,
  Bar,
  Line,
} from 'recharts';

// Sample monthly data (fallback)
const defaultData = [
  { name: 'January', gross: 0, vat: 0, net: 0 },
  { name: 'February', gross: 0, vat: 0, net: 0 },
  { name: 'March', gross: 0, vat: 0, net: 0 },
  { name: 'April', gross: 0, vat: 0, net: 0 },
  { name: 'May', gross: 0, vat: 0, net: 0 },
  { name: 'June', gross: 0, vat: 0, net: 0 },
  { name: 'July', gross: 0, vat: 0, net: 0 },
  { name: 'August', gross: 0, vat: 0, net: 0 },
  { name: 'September', gross: 0, vat: 0, net: 0 },
  { name: 'October', gross: 0, vat: 0, net: 0 },
  { name: 'November', gross: 0, vat: 0, net: 0 },
  { name: 'December', gross: 0, vat: 0, net: 0 },
];

export interface LineBarAreaComposedChartProps {
  data?: Array<{ name: string; gross: number; vat: number; net: number }>;
  height?: number;
}

const LineBarAreaComposedChart: React.FC<LineBarAreaComposedChartProps> = ({
  data = defaultData,
  height = 320,
}) => {
  // Memoized number formatter & function to avoid re-creating on layout/resizes
  const nf = useMemo(() => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }), []);
  const formatNumber = useCallback((n: number) => nf.format(n || 0), [nf]);

  type TP = {
    active?: boolean;
    payload?: Array<{
      payload?: { name?: string; gross?: number; vat?: number; net?: number };
    }>;
  };
  const CustomTooltip = ({ active, payload }: TP) => {
    if (!active || !payload || payload.length === 0) return null;
    const p = payload[0]?.payload ?? {};
    const month = p.name as string;
    const gross = Number(p.gross || 0);
    const vat = Number(p.vat || 0);
    const net = Number(p.net || gross - vat);

    return (
      <div
        className="rounded-md border bg-card px-3 py-2 text-sm shadow-sm"
        style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
      >
        <div className="mb-1 font-semibold">{month}</div>
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: 'var(--primary)' }}
            />
            <span>
              Gross: <strong className="tabular-nums">{formatNumber(gross)} DH</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: 'var(--accent)' }}
            />
            <span>
              Net: <strong className="tabular-nums">{formatNumber(net)} DH</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: 'var(--destructive)' }}
            />
            <span>
              VAT: <strong className="tabular-nums">{formatNumber(vat)} DH</strong>
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height} debounce={150}>
        <ComposedChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickMargin={8}
          />
          <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} width={40} />
          <Tooltip
            cursor={{ stroke: 'var(--border)' }}
            content={<CustomTooltip />}
            wrapperStyle={{ outline: 'none' }}
          />
          <Legend wrapperStyle={{ color: 'var(--muted-foreground)', fontSize: 12 }} />
          {/* Bar: Net total (gross - VAT) */}
          <Bar
            name="Net"
            dataKey="net"
            fill="var(--success)"
            barSize={20}
            isAnimationActive={false}
          />
          {/* Optional line overlay for Net */}
          <Line
            name="Net"
            type="monotone"
            dataKey="net"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            legendType="none" /* keep legend single for Net (bar) */
            isAnimationActive={false}
          />
          {/* Points: Gross and VAT */}
          <Scatter name="Gross" dataKey="gross" fill="var(--primary)" isAnimationActive={false} />
          <Scatter name="VAT" dataKey="vat" fill="var(--destructive)" isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(LineBarAreaComposedChart);
