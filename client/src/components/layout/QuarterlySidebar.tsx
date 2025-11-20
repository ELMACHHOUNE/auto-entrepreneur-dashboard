import { useMemo } from 'react';
import { Select } from '@mantine/core';
import { selectFilledStyles } from '@/components/ui/mantineStyles';

export interface QuarterlySidebarProps {
  year: number;
  quarterTotals: { T1: number; T2: number; T3: number; T4: number };
  yearTotals: { amount: number; tva: number };
  lifetimeTotals?: { amount: number; tva: number }; // all-time totals across every invoice
  rateDisplay: number; // percent multiplier shown & applied
  onRateDisplayChange: (rate: number) => void;
  onRequestClose?: () => void; // optional close callback rendered as button in shell
}

// Reusable right insights panel with internal collapse toggle
export default function QuarterlySidebar({
  year,
  quarterTotals,
  yearTotals,
  lifetimeTotals,
  rateDisplay,
  onRateDisplayChange,
}: QuarterlySidebarProps) {
  const rateOptions = useMemo(
    () => [0.5, 1, 20].map(r => ({ value: r.toString(), label: r + '%' })),
    []
  );

  // Compute yearly VAT dynamically from selected rate
  const yearlyVatAtRate = useMemo(() => {
    const val = (yearTotals.amount * rateDisplay) / 100;
    return Number.isFinite(val) ? parseFloat(val.toFixed(2)) : 0;
  }, [yearTotals.amount, rateDisplay]);

  const lifetimeVatAtRate = useMemo(() => {
    const base = lifetimeTotals?.amount || 0;
    const val = (base * rateDisplay) / 100;
    return Number.isFinite(val) ? parseFloat(val.toFixed(2)) : 0;
  }, [lifetimeTotals?.amount, rateDisplay]);

  return (
    <div className="flex h-full flex-col gap-3" aria-label="Quarterly totals panel">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold tracking-wide text-foreground">
          Quarterly Totals {year}
        </h4>
        <Select
          data={rateOptions}
          size="xs"
          value={rateDisplay.toString()}
          onChange={v => onRateDisplayChange(parseFloat(v || '1'))}
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
          Total VAT ({rateDisplay}%): {yearlyVatAtRate.toLocaleString('en-US')} DH
        </div>
      </div>
      {lifetimeTotals && (
        <div className="rounded-md border border-accent/60 p-3 bg-card/40 flex flex-col gap-1 text-foreground mt-1">
          <div className="text-xs font-medium flex justify-between">
            <span>All-Time Total</span>
            <span className="text-secondary">VAT</span>
          </div>
          <div className="text-sm font-semibold text-primary">
            {lifetimeTotals.amount.toLocaleString('en-US')} DH
          </div>
          <div className="text-xs text-secondary">
            VAT ({rateDisplay}%): {lifetimeVatAtRate.toLocaleString('en-US')} DH
          </div>
        </div>
      )}
    </div>
  );
}

// Provide a named export alongside default for flexible import styles
export { QuarterlySidebar };
