import { Table } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InvoiceTable from '@/components/invoices/InvoiceTable';
import { useState, useCallback } from 'react';
import { QuarterlySidebar } from '@/components/layout/QuarterlySidebar';

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

  return (
    <DashboardLayout rightSidebar={rightSidebar} rightCollapsible>
      {/* Chart + Table layout scaffold */}
      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">Chart A</div>
        <div className="rounded-lg border p-4">Chart B</div>
        <div className="rounded-lg border p-4">Chart C</div>
        <div className="rounded-lg border p-4">Chart D</div>
      </section>

      <section className="rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2">
          <Table size={18} />
          <h3 className="text-lg font-medium">Data table</h3>
        </div>
        <InvoiceTable onQuarterSummaryChange={handleQuarterSummary} />
      </section>
    </DashboardLayout>
  );
}
