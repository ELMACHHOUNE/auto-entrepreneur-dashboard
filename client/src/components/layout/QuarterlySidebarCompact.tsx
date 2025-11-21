// Compact right sidebar content for quarterly totals when panel is collapsed
import { useTranslation } from 'react-i18next';

export interface QuarterlySidebarCompactProps {
  year: number;
  quarterTotals: { T1: number; T2: number; T3: number; T4: number };
  rateDisplay?: number; // optional (not shown in compact view)
  yearTotals?: { amount: number; tva: number }; // for yearly total card
  lifetimeTotals?: { amount: number; tva: number }; // all-time total
}

export default function QuarterlySidebarCompact({
  year,
  quarterTotals,
  yearTotals,
  lifetimeTotals,
}: QuarterlySidebarCompactProps) {
  const { t } = useTranslation();
  return (
    <div
      className="flex h-full flex-col gap-4"
      aria-label={t('sidebar.quarterlyCompact.aria', { year })}
    >
      <div className="text-xs font-medium text-foreground/80 mb-1">
        {t('sidebar.quarterlyCompact.qTotals', { year })}
      </div>
      {(['T1', 'T2', 'T3', 'T4'] as const).map(label => {
        const base = quarterTotals[label] || 0;
        return (
          <div
            key={label}
            className="rounded-md border border-accent/60 p-2 bg-card/60 flex items-center justify-between px-3 text-foreground"
          >
            <span className="text-sm font-medium">{label}</span>
            <span className="text-sm font-semibold text-success">
              {base.toLocaleString('fr-MA')} DH
            </span>
          </div>
        );
      })}
      {yearTotals && (
        <div className="rounded-md border border-accent/60 p-2 bg-card/70 flex items-center justify-between px-3 text-foreground mt-6">
          <span className="text-sm font-medium">{t('sidebar.quarterlyCompact.year')}</span>
          <span className="text-sm font-semibold text-success">
            {yearTotals.amount.toLocaleString('en-US')} DH
          </span>
        </div>
      )}
      {lifetimeTotals && (
        <div className="rounded-md border border-accent/60 p-2 bg-card/80 flex items-center justify-between px-3 text-foreground mt-2">
          <span className="text-sm font-medium">{t('sidebar.quarterlyCompact.allTime')}</span>
          <span className="text-sm font-semibold text-primary">
            {lifetimeTotals.amount.toLocaleString('en-US')} DH
          </span>
        </div>
      )}
    </div>
  );
}
