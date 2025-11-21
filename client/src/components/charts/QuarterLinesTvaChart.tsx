import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QuarterLinesChartUI from '@/components/ui/quarter-lines-chart';
import type { QuarterLinePoint } from '@/components/ui/quarter-lines-chart';
import { useInvoicesByYear } from '@/hooks/useInvoicesByYear';
import { MONTHS, monthToQuarterByName } from '@/lib/dateBuckets';

export interface QuarterLinesTvaChartProps {
  year: number;
}

export const QuarterLinesTvaChart: React.FC<QuarterLinesTvaChartProps> = ({ year }) => {
  const { t, i18n } = useTranslation();
  const { data: invoices, isLoading } = useInvoicesByYear(year);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const compute = () => setIsMobile(window.innerWidth <= 640);
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const compactFormat = (n: number) =>
    new Intl.NumberFormat(i18n.language, { notation: 'compact', maximumFractionDigits: 1 }).format(
      n || 0
    );
  const normalFormat = (n: number) =>
    new Intl.NumberFormat(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n || 0);
  const monthShort = (label: string) => {
    const full = t(`months.${label}`);
    return typeof full === 'string' ? full.slice(0, 3) : (full as string);
  };

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
    <div className="w-full h-full" style={{ minHeight: isMobile ? 300 : 240 }}>
      {!hasAny && !isLoading ? (
        <div className="flex h-full min-h-60 items-center justify-center">
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            {t('page.dashboard.charts.noDataForYear', { year })}
          </span>
        </div>
      ) : (
        <QuarterLinesChartUI
          data={data}
          valueFormatter={isMobile ? compactFormat : normalFormat}
          xTickFormatter={monthShort}
          labelFormatter={(label: string) => t(`months.${label}`)}
          xTickAngle={isMobile ? 0 : -30}
          xTickInterval={isMobile ? ('preserveStartEnd' as unknown as number) : 0}
          xTickFontSize={isMobile ? 11 : 12}
          bottomMargin={isMobile ? 36 : 60}
          yAxisWidth={isMobile ? 56 : 72}
          marginLeft={isMobile ? 8 : 16}
          marginRight={isMobile ? 8 : 16}
          height={isMobile ? 300 : 280}
        />
      )}
    </div>
  );
};

export default QuarterLinesTvaChart;
