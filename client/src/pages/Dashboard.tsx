import { Table } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InvoiceTable from '@/components/invoices/InvoiceTable';
import { useState, useCallback } from 'react';
import { Select } from '@mantine/core';
import { selectFilledStyles } from '@/components/ui/mantineStyles';

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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold tracking-wide text-foreground">
          Quarterly Totals {year}
        </h4>
        <Select
          data={[0.5, 1, 20].map(r => ({ value: r.toString(), label: r + '%' }))}
          size="xs"
          value={rateDisplay.toString()}
          onChange={v => setRateDisplay(parseFloat(v || '1'))}
          variant="filled"
          styles={{ ...selectFilledStyles, input: { ...selectFilledStyles.input, minWidth: 70 } }}
        />
      </div>
      {(['T1', 'T2', 'T3', 'T4'] as const).map(label => {
        const rateAmount = parseFloat(((quarterTotals[label] * rateDisplay) / 100).toFixed(2));
        return (
          <div
            key={label}
            className="rounded-md border border-accent/60 p-3 bg-card/50 flex flex-col gap-1 text-foreground"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{label}</span>
              <span className="text-secondary font-medium">{rateDisplay}%</span>
            </div>
            <div className="text-sm font-semibold text-success">
              {quarterTotals[label].toLocaleString('fr-MA')} DH
            </div>
            <div className="text-xs text-secondary">
              {rateDisplay}%: {rateAmount.toLocaleString('en-US')} DH
            </div>
          </div>
        );
      })}
      <div className="rounded-md border border-accent/60 p-3 bg-card/50 flex flex-col gap-1 text-foreground mt-2">
        <div className="text-xs font-medium flex justify-between">
          <span>Yearly Total</span>
          <span className="text-secondary">VAT</span>
        </div>
        <div className="text-sm font-semibold text-success">
          {yearTotals.amount.toLocaleString('en-US')} DH
        </div>
        <div className="text-xs text-secondary">
          Total VAT: {yearTotals.tva.toLocaleString('en-US')} DH
        </div>
      </div>
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
