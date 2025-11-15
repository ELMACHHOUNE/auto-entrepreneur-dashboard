import type { ReactNode } from 'react';

export default function StatsCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{title}</div>
        {icon}
      </div>
      <div className="mt-1 text-3xl font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
        {value}
      </div>
    </div>
  );
}
