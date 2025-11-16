import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

type ApiInvoice = {
  _id: string;
  year: number;
  month: string;
  clientName: string;
  amount: number;
  tvaRate: number; // percent
};

async function fetchAllInvoices(): Promise<ApiInvoice[]> {
  const { data } = await api.get('/api/invoices');
  return (data.invoices || []) as ApiInvoice[];
}

type Row = { name: string; total: number; vat: number };

const numberFmt = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n || 0);

const YearTotalsBarChart: React.FC = () => {
  // Detect mobile screens only to tweak sizing; desktop stays exactly the same
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const compute = () => setIsMobile(window.innerWidth <= 640);
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', 'all-years'],
    queryFn: fetchAllInvoices,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const data = useMemo<Row[]>(() => {
    const byYear = new Map<number, { total: number; vat: number }>();
    (invoices || []).forEach(inv => {
      const vat = (inv.amount * (inv.tvaRate || 0)) / 100;
      const entry = byYear.get(inv.year) || { total: 0, vat: 0 };
      entry.total += inv.amount || 0;
      entry.vat += vat || 0;
      byYear.set(inv.year, entry);
    });
    const years = Array.from(byYear.keys()).sort((a, b) => a - b);
    return years.map(y => ({
      name: String(y),
      total: byYear.get(y)!.total,
      vat: byYear.get(y)!.vat,
    }));
  }, [invoices]);

  const hasAny = data.length > 0;

  // Sizing – desktop values kept identical to original; mobile uses smaller sizes
  // Sizing – fix explicit heights to prevent legend overflow on both mobile and desktop
  const mobileChartHeight = 300;
  const desktopChartHeight = 360;
  const containerMinHeight = isMobile ? 260 : 320;
  const chartMargin = isMobile
    ? { top: 6, right: 8, left: 4, bottom: 20 }
    : { top: 8, right: 12, left: 8, bottom: 0 };
  const barCategoryGap = isMobile ? '24%' : '40%';
  const barGap = isMobile ? 4 : 8;
  const xTickMargin = isMobile ? 6 : 10;
  const yAxisWidth = isMobile ? 56 : 72;
  const legendHeight = isMobile ? 28 : 18;
  const legendFontSize = isMobile ? 11 : 16;
  const barSize = isMobile ? 10 : 22;

  return (
    <div className="w-full h-full" style={{ minHeight: containerMinHeight }}>
      {!hasAny && !isLoading ? (
        <div className="flex h-full min-h-60 items-center justify-center">
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            No invoices yet.
          </span>
        </div>
      ) : (
        <>
          <ResponsiveContainer
            width="100%"
            height={isMobile ? mobileChartHeight : desktopChartHeight}
            debounce={150}
          >
            <BarChart
              data={data}
              margin={chartMargin}
              barCategoryGap={barCategoryGap}
              barGap={barGap}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickMargin={xTickMargin} interval="preserveStartEnd" />
              <YAxis tickFormatter={v => numberFmt(Number(v))} width={yAxisWidth} />
              <Tooltip
                formatter={(value: unknown, n) => [numberFmt(Number(value)) + ' DH', n as string]}
                labelFormatter={label => `Year ${label}`}
                contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                wrapperStyle={{ outline: 'none' }}
              />
              {!isMobile && (
                <Legend
                  verticalAlign="bottom"
                  height={legendHeight}
                  wrapperStyle={{ fontSize: legendFontSize }}
                />
              )}
              <Bar dataKey="total" name="Total Price" fill="#0776c0" barSize={barSize}>
                <LabelList
                  dataKey="total"
                  position="top"
                  formatter={(v: unknown) => `${numberFmt(Number(v))} DH`}
                  style={{ fill: 'var(--foreground)', fontSize: 16 }}
                />
              </Bar>
              <Bar dataKey="vat" name="Total VAT" fill="#fdc401" barSize={barSize}>
                <LabelList
                  dataKey="vat"
                  position="top"
                  formatter={(v: unknown) => `${numberFmt(Number(v))} DH`}
                  style={{ fill: 'var(--foreground)', fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {hasAny && !isLoading && isMobile && (
            <div className="mt-1 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: '#0776c0',
                    display: 'inline-block',
                    borderRadius: 2,
                  }}
                />
                Total Price
              </span>
              <span className="inline-flex items-center gap-1">
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: '#fdc401',
                    display: 'inline-block',
                    borderRadius: 2,
                  }}
                />
                Total VAT
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(YearTotalsBarChart);
