import { Table } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Suspense, lazy, useState, useCallback, useMemo, useRef } from 'react';
import type { Month } from '@/lib/dateBuckets';
import { QuarterlySidebar } from '@/components/layout/QuarterlySidebar';
import QuarterlySidebarCompact from '@/components/layout/QuarterlySidebarCompact';
const QuarterLinesChart = lazy(() => import('@/components/charts/QuarterLinesChart'));
const QuarterLinesTvaChart = lazy(() => import('@/components/charts/QuarterLinesTvaChart'));
const LineBarAreaComposedChart = lazy(() => import('@/components/charts/LineBarAreaComposedChart'));
const ClientsRadarChart = lazy(() => import('@/components/charts/ClientsRadarChart'));
const YearTotalsBarChart = lazy(() => import('@/components/charts/YearTotalsBarChart'));

const InvoiceTable = lazy(() => import('@/components/invoices/InvoiceTable'));

export default function Dashboard() {
  const chartsRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
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

  const onExportCharts = useCallback(async () => {
    const node = chartsRef.current;
    if (!node) return;
    const totalAmount = monthlyTotals.reduce((sum, m) => sum + (m.gross || 0), 0);
    const totalTva = monthlyTotals.reduce((sum, m) => sum + (m.vat || 0), 0);
    const { exportChartsOnePageFromElement } = await import('@/lib/pdfExport');
    await exportChartsOnePageFromElement(node, {
      title: `Dashboard charts (${year})`,
      year,
      clientsCount: clientCounts.length,
      totalAmount,
      totalTva,
      // Explicit captions to guarantee naming order in PDF
      chartTitles: [
        `Quarter totals by month (${year})`,
        `VAT totals by month (${year})`,
        `Invoices per client (${year})`,
        `Yearly totals (Price vs VAT)`,
        `Composed chart (sample)`,
      ],
    });
  }, [year, clientCounts.length, monthlyTotals]);

  const onExportTable = useCallback(async () => {
    const node = tableRef.current;
    if (!node) return;
    const { exportDataTablePdfFromElement } = await import('@/lib/pdfExport');
    await exportDataTablePdfFromElement(node, { title: `Invoices table (${year})` });
  }, [year]);

  return (
    <DashboardLayout
      rightSidebar={rightSidebar}
      rightSidebarCollapsed={rightSidebarCollapsed}
      rightCollapsible
    >
      {/* Actions for charts (left-aligned) */}
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onExportCharts}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-foreground)',
            borderColor: 'var(--accent)',
          }}
        >
          Export charts as PDF
        </button>
      </div>
      {/* Chart + Table layout scaffold */}
      <section ref={chartsRef} className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4 min-h-80">
          <h4 className="mb-2 text-sm font-medium">Quarter totals by month ({year})</h4>
          <Suspense fallback={<div className="text-xs text-muted-foreground">Loading chart…</div>}>
            <QuarterLinesChart year={year} />
          </Suspense>
        </div>
        <div className="rounded-lg border p-4 min-h-80">
          <h4 className="mb-2 text-sm font-medium">VAT totals by month ({year})</h4>
          <Suspense fallback={<div className="text-xs text-muted-foreground">Loading chart…</div>}>
            <QuarterLinesTvaChart year={year} />
          </Suspense>
        </div>
        <div className="rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-medium">Invoices per client ({year})</h4>
          <Suspense fallback={<div className="text-xs text-muted-foreground">Loading chart…</div>}>
            <ClientsRadarChart data={clientCounts} noDataLabel={`No data for ${year}.`} />
          </Suspense>
        </div>
        <div className="rounded-lg border p-4 min-h-96">
          <h4 className="mb-6 text-sm font-medium">Yearly totals (Price vs VAT)</h4>
          <Suspense fallback={<div className="text-xs text-muted-foreground">Loading chart…</div>}>
            <YearTotalsBarChart />
          </Suspense>
        </div>
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
        <div className="mb-3">
          <button
            type="button"
            onClick={onExportTable}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-foreground)',
              borderColor: 'var(--accent)',
            }}
          >
            Export table PDF
          </button>
        </div>
        <div ref={tableRef}>
          <Suspense fallback={<div className="text-xs text-muted-foreground">Loading table…</div>}>
            <InvoiceTable
              onQuarterSummaryChange={handleQuarterSummary}
              onMonthlyTotalsChange={setMonthlyTotals}
              onClientCountsChange={setClientCounts}
            />
          </Suspense>
        </div>
      </section>
    </DashboardLayout>
  );
}
