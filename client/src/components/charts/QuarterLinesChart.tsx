import React, { useMemo } from 'react';
import QuarterLinesChartUI from '@/components/ui/quarter-lines-chart';
import type { QuarterLinePoint } from '@/components/ui/quarter-lines-chart';
import { useInvoicesByYear } from '@/hooks/useInvoicesByYear';
import { MONTHS, monthToQuarterByName } from '@/lib/dateBuckets';

export interface QuarterLinesChartProps {
  year: number;
}

// Data point for Recharts
type ChartPoint = QuarterLinePoint;

export const QuarterLinesChart: React.FC<QuarterLinesChartProps> = ({ year }) => {
  const { data: invoices, isLoading } = useInvoicesByYear(year);

  const chartData = useMemo<ChartPoint[]>(() => {
    const arr: ChartPoint[] = MONTHS.map(m => ({ name: m, T1: 0, T2: 0, T3: 0, T4: 0 }));
    (invoices || []).forEach(inv => {
      const idx = MONTHS.indexOf(inv.month);
      if (idx >= 0) {
        const q = monthToQuarterByName(inv.month);
        arr[idx][q] += inv.amount || 0;
      }
    });
    return arr;
  }, [invoices]);

  const hasAny = useMemo(() => chartData.some(d => d.T1 || d.T2 || d.T3 || d.T4), [chartData]);

  return (
    <div className="w-full h-full" style={{ minHeight: 240 }}>
      {!hasAny && !isLoading ? (
        <div className="flex h-full min-h-60 items-center justify-center">
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            No data for {year}.
          </span>
        </div>
      ) : (
        <QuarterLinesChartUI data={chartData} />
      )}
    </div>
  );
};

export default QuarterLinesChart;
