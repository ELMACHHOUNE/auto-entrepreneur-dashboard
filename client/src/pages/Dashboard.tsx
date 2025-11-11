import { Table } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Suspense, lazy, useState, useCallback } from 'react';
import { QuarterlySidebar } from '@/components/layout/QuarterlySidebar';
import QuarterlySidebarCompact from '@/components/layout/QuarterlySidebarCompact';
const QuarterLinesChart = lazy(() => import('@/components/charts/QuarterLinesChart'));
const QuarterLinesTvaChart = lazy(() => import('@/components/charts/QuarterLinesTvaChart'));

const InvoiceTable = lazy(() => import('@/components/invoices/InvoiceTable'));

export default function Dashboard() {
  const [quarterTotals, setQuarterTotals] = useState({ T1: 0, T2: 0, T3: 0, T4: 0 });
  const [yearTotals, setYearTotals] = useState({ amount: 0, tva: 0 });
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [rateDisplay, setRateDisplay] = useState<number>(1); // dynamic percentage to apply to quarterly totals

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
        <div className="rounded-lg border p-4">Chart C</div>
        <div className="rounded-lg border p-4">Chart D</div>
      </section>

      <section className="rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2">
          <Table size={18} />
          <h3 className="text-lg font-medium">Data table</h3>
        </div>
        <Suspense fallback={<div className="text-xs text-muted-foreground">Loading table…</div>}>
          <InvoiceTable onQuarterSummaryChange={handleQuarterSummary} />
        </Suspense>
      </section>
    </DashboardLayout>
  );
}
