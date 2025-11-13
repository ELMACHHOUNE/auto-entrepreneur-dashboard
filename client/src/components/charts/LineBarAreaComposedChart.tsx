import React from 'react';
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
  const formatNumber = (n: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n || 0);

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
            <span className="inline-block h-2 w-2 rounded-full bg-[#0776c0]" />
            <span>
              Gross: <strong className="tabular-nums">{formatNumber(gross)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#fdc401]" />
            <span>
              Net: <strong className="tabular-nums">{formatNumber(net)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#d11c0a]" />
            <span>
              VAT: <strong className="tabular-nums">{formatNumber(vat)}</strong>
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
          <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} width={40} />
          <Tooltip
            cursor={{ stroke: 'var(--border)' }}
            content={<CustomTooltip />}
            wrapperStyle={{ outline: 'none' }}
          />
          <Legend wrapperStyle={{ color: 'var(--muted-foreground)', fontSize: 12 }} />
          {/* Bar: Net total (gross - VAT) */}
          <Bar name="Net" dataKey="net" fill="#519d09" barSize={20} />
          {/* Optional line overlay for Net */}
          <Line
            name="Net"
            type="monotone"
            dataKey="net"
            stroke="#fdc401"
            strokeWidth={2}
            dot={false}
            legendType="none" /* keep legend single for Net (bar) */
          />
          {/* Points: Gross and VAT */}
          <Scatter name="Gross" dataKey="gross" fill="#0776c0" />
          <Scatter name="VAT" dataKey="vat" fill="#d11c0a" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineBarAreaComposedChart;
