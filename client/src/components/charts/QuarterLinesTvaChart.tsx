import React, { useMemo } from 'react';
import QuarterLinesChartUI from '@/components/ui/quarter-lines-chart';
import type { QuarterLinePoint } from '@/components/ui/quarter-lines-chart';
import { useInvoicesByYear } from '@/hooks/useInvoicesByYear';
import { MONTHS, monthToQuarterByName } from '@/lib/dateBuckets';

export interface QuarterLinesTvaChartProps {
  year: number;
}

export const QuarterLinesTvaChart: React.FC<QuarterLinesTvaChartProps> = ({ year }) => {
  const { data: invoices, isLoading } = useInvoicesByYear(year);

  const data = useMemo<QuarterLinePoint[]>(() => {
    const arr: QuarterLinePoint[] = MONTHS.map(m => ({ name: m, T1: 0, T2: 0, T3: 0, T4: 0 }));
    (invoices || []).forEach(inv => {
      const idx = MONTHS.indexOf(inv.month);
      if (idx >= 0) {
        const q = monthToQuarterByName(inv.month);
        const tva = ((inv.amount || 0) * (inv.tvaRate || 0)) / 100;
        arr[idx][q] += tva;
      }
    });
    return arr;
  }, [invoices]);

  const hasAny = useMemo(() => data.some(d => d.T1 || d.T2 || d.T3 || d.T4), [data]);

  return (
    <div className="w-full h-full" style={{ minHeight: 240 }}>
      {!hasAny && !isLoading ? (
        <div className="flex h-full min-h-60 items-center justify-center">
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            No TVA data for {year}.
          </span>
        </div>
      ) : (
        <QuarterLinesChartUI data={data} />
      )}
    </div>
  );
};

export default QuarterLinesTvaChart;
