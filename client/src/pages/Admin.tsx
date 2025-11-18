import { useCallback, useMemo, useRef } from 'react';
import { FileText } from 'lucide-react';
import RequireRole from '@/components/RequireRole';
import StatsCard from '@/components/admin/StatsCard';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import YearlySignupsChart from '@/components/admin/YearlySignupsChart';
import UsersByCategoryChart from '@/components/admin/UsersByCategoryChart';
import {
  useAdminUsersByCategory,
  useAdminUsersTotal,
  useAdminUsersYearly,
} from '@/hooks/useAdminUserStats';
// export helper is dynamically imported on demand to keep bundle small
// number formatting handled by AnimatedNumber

export default function Admin() {
  const { data: yearly = [], isLoading: loadingYear, error: errorYear } = useAdminUsersYearly();
  const { data: byCat = [], isLoading: loadingCat, error: errorCat } = useAdminUsersByCategory();
  const { data: total = 0, isLoading: loadingTotal, error: errorTotal } = useAdminUsersTotal();

  const yearlyData = useMemo(() => yearly, [yearly]);

  const catData = useMemo(() => byCat, [byCat]);

  // Capture area ref for PDF export
  const exportRef = useRef<HTMLDivElement | null>(null);

  const onExportPdf = useCallback(async () => {
    const node = exportRef.current;
    if (!node) return;
    const { exportAdminPdfFromElement } = await import('@/lib/pdfExport');
    await exportAdminPdfFromElement(node, {
      totalUsers: total,
      title: 'Auto Entrepreneur Dashboard',
      yearlyData,
      catData,
    });
  }, [total, yearlyData, catData]);

  return (
    <RequireRole role="admin">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Admin Panel</h2>
            <p className="text-sm text-muted-foreground">Only admins can see this.</p>
          </div>
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-foreground)',
              borderColor: 'var(--accent)',
            }}
          >
            <FileText size={16} />
            <span>Export PDF</span>
          </button>
        </div>

        <div ref={exportRef} id="pdf-export">
          {/* Total users card */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <StatsCard
                title="Total users"
                size="5xl"
                value={
                  loadingTotal ? (
                    '…'
                  ) : (
                    <AnimatedNumber value={total} duration={1200} className="leading-none" />
                  )
                }
              />
              {errorTotal && (
                <div className="mt-1 text-xs text-destructive">Failed to load total users.</div>
              )}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Yearly signups (Composed-style: bar + line) */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">User signups per year</h3>
              </div>
              {errorYear && (
                <div className="mb-2 text-xs text-destructive">Failed to load yearly stats.</div>
              )}
              {loadingYear ? (
                <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                  Loading…
                </div>
              ) : yearlyData.length === 0 ? (
                <div
                  className="flex h-72 items-center justify-center text-sm"
                  style={{ color: 'var(--accent)' }}
                >
                  No data
                </div>
              ) : (
                <YearlySignupsChart data={yearlyData} height={320} />
              )}
            </div>

            {/* Users by category */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Users by category</h3>
              </div>
              {errorCat && (
                <div className="mb-2 text-xs text-destructive">Failed to load category stats.</div>
              )}
              {loadingCat ? (
                <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                  Loading…
                </div>
              ) : catData.length === 0 ? (
                <div
                  className="flex h-72 items-center justify-center text-sm"
                  style={{ color: 'var(--accent)' }}
                >
                  No data
                </div>
              ) : (
                <UsersByCategoryChart data={catData} height={320} />
              )}
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
