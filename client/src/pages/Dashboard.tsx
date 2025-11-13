import { Table } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Suspense, lazy, useState, useCallback, useMemo } from 'react';
import type { Month } from '@/lib/dateBuckets';
import { QuarterlySidebar } from '@/components/layout/QuarterlySidebar';
import QuarterlySidebarCompact from '@/components/layout/QuarterlySidebarCompact';
const QuarterLinesChart = lazy(() => import('@/components/charts/QuarterLinesChart'));
const QuarterLinesTvaChart = lazy(() => import('@/components/charts/QuarterLinesTvaChart'));
const LineBarAreaComposedChart = lazy(() => import('@/components/charts/LineBarAreaComposedChart'));
const ClientsRadarChart = lazy(() => import('@/components/charts/ClientsRadarChart'));

const InvoiceTable = lazy(() => import('@/components/invoices/InvoiceTable'));

export default function Dashboard() {
  const [quarterTotals, setQuarterTotals] = useState({ T1: 0, T2: 0, T3: 0, T4: 0 });
  const [yearTotals, setYearTotals] = useState({ amount: 0, tva: 0 });
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [rateDisplay, setRateDisplay] = useState<number>(1); // dynamic percentage to apply to quarterly totals
  const [monthlyTotals, setMonthlyTotals] = useState<
    Array<{ month: Month; gross: number; vat: number; net: number }>
  >([]);
  const [clientCounts, setClientCounts] = useState<Array<{ name: string; count: number }>>([]);
  const chartData = useMemo(
    () =>
      monthlyTotals.map(m => ({
        name: m.month,
        gross: m.gross,
        vat: m.vat,
        net: m.net,
      })),
    [monthlyTotals]
  );

  const handleQuarterSummary = useCallback(
    (summary: {
      year: number;
      totals: { T1: number; T2: number; T3: number; T4: number };
      totalYearAmount: number;
      totalYearTva: number;
    }) => {
      setQuarterTotals(summary.totals);
      setYearTotals({ amount: summary.totalYearAmount, tva: summary.totalYearTva });
      setYear(summary.year);
    },
    []
  );

  const rightSidebar = (
    <QuarterlySidebar
      year={year}
      quarterTotals={quarterTotals}
      yearTotals={yearTotals}
      rateDisplay={rateDisplay}
      onRateDisplayChange={setRateDisplay}
    />
  );
  const rightSidebarCollapsed = (
    <QuarterlySidebarCompact year={year} quarterTotals={quarterTotals} yearTotals={yearTotals} />
  );

  return (
    <DashboardLayout
      rightSidebar={rightSidebar}
      rightSidebarCollapsed={rightSidebarCollapsed}
      rightCollapsible
    >
      {/* Chart + Table layout scaffold */}
      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-medium">Quarter totals by month ({year})</h4>
          <Suspense fallback={<div className="text-xs text-muted-foreground">Loading chart…</div>}>
            <QuarterLinesChart year={year} />
          </Suspense>
        </div>
        <div className="rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-medium">VAT totals by month ({year})</h4>
          <Suspense fallback={<div className="text-xs text-muted-foreground">Loading chart…</div>}>
            <QuarterLinesTvaChart year={year} />
          </Suspense>
        </div>
        <div className="rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-medium">Invoices per client ({year})</h4>
          <Suspense fallback={<div className="text-xs text-muted-foreground">Loading chart…</div>}>
            <ClientsRadarChart data={clientCounts} />
          </Suspense>
        </div>
        <div className="rounded-lg border p-4">Chart D</div>
        {/* Full-width composed chart row */}
        <div className="rounded-lg border p-4 md:col-span-2">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h4 className="text-sm font-medium">Composed chart (sample)</h4>
            {/* Year totals summary from InvoiceTable callback */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md border px-3 py-1.5">
                <div className="text-muted-foreground">Total price ({year})</div>
                <div className="tabular-nums font-semibold">
                  {yearTotals.amount.toLocaleString('en-US')} DH
                </div>
              </div>
              <div className="rounded-md border px-3 py-1.5">
                <div className="text-muted-foreground">Total TVA ({year})</div>
                <div className="tabular-nums font-semibold">
                  {yearTotals.tva.toLocaleString('en-US')} DH
                </div>
              </div>
            </div>
          </div>
          <Suspense fallback={<div className="text-xs text-muted-foreground">Loading chart…</div>}>
            <LineBarAreaComposedChart data={chartData} />
          </Suspense>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2">
          <Table size={18} />
          <h3 className="text-lg font-medium">Data table</h3>
        </div>
        <Suspense fallback={<div className="text-xs text-muted-foreground">Loading table…</div>}>
          <InvoiceTable
            onQuarterSummaryChange={handleQuarterSummary}
            onMonthlyTotalsChange={setMonthlyTotals}
            onClientCountsChange={setClientCounts}
          />
        </Suspense>
      </section>
    </DashboardLayout>
  );
}
