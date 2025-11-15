import type { ReactNode } from 'react';

export default function StatsCard({
  title,
  value,
  icon,
  size = '5xl',
}: {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  size?: '3xl' | '4xl' | '5xl';
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{title}</div>
        {icon}
      </div>
      <div
        className={`mt-1 font-bold tabular-nums ${
          size === '5xl' ? 'text-5xl' : size === '4xl' ? 'text-4xl' : 'text-3xl'
        }`}
        style={{ color: 'var(--accent)' }}
      >
        {value}
      </div>
    </div>
  );
}
