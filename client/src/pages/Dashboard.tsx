import { Table } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InvoiceTable from '@/components/invoices/InvoiceTable';
import { useState, useCallback } from 'react';

export default function Dashboard() {
  const [quarterTotals, setQuarterTotals] = useState({ T1: 0, T2: 0, T3: 0, T4: 0 });
  const [onePercent, setOnePercent] = useState({ T1: 0, T2: 0, T3: 0, T4: 0 });
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const handleQuarterSummary = useCallback(
    (summary: {
      year: number;
      totals: { T1: number; T2: number; T3: number; T4: number };
      onePercent: { T1: number; T2: number; T3: number; T4: number };
    }) => {
      setQuarterTotals(summary.totals);
      setOnePercent(summary.onePercent);
      setYear(summary.year);
    },
    []
  );

  const rightSidebar = (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold tracking-wide text-foreground">
        Totaux Trimestriels {year}
      </h4>
      {(['T1', 'T2', 'T3', 'T4'] as const).map(label => (
        <div
          key={label}
          className="rounded-md border border-accent/60 p-3 bg-card/50 flex flex-col gap-1 text-foreground"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{label}</span>
            <span className="text-secondary font-medium">1%</span>
          </div>
          <div className="text-sm font-semibold text-success">
            {quarterTotals[label].toLocaleString('fr-MA')} DH
          </div>
          <div className="text-xs text-secondary">
            1%: {onePercent[label].toLocaleString('fr-MA')} DH
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <DashboardLayout rightSidebar={rightSidebar}>
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
