// Compact right sidebar content for quarterly totals when panel is collapsed

export interface QuarterlySidebarCompactProps {
  year: number;
  quarterTotals: { T1: number; T2: number; T3: number; T4: number };
  rateDisplay?: number; // optional (not shown in compact view)
  yearTotals?: { amount: number; tva: number }; // for yearly total card
}

export default function QuarterlySidebarCompact({
  year,
  quarterTotals,
  yearTotals,
}: QuarterlySidebarCompactProps) {
  return (
    <div className="flex h-full flex-col gap-2" aria-label={`Quarterly summary ${year} (compact)`}>
      <div className="text-xs font-medium text-foreground/80 mb-1">Q Totals {year}</div>
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
        <div className="rounded-md border border-accent/60 p-2 bg-card/70 flex items-center justify-between px-3 text-foreground mt-1">
          <span className="text-sm font-medium">Year</span>
          <span className="text-sm font-semibold text-success">
            {yearTotals.amount.toLocaleString('en-US')} DH
          </span>
        </div>
      )}
    </div>
  );
}
