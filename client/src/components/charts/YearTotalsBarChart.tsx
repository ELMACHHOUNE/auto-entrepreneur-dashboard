import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type ApiInvoice = {
  _id: string;
  year: number;
  month: string;
  clientName: string;
  amount: number;
  tvaRate: number; // percent
};

async function fetchAllInvoices(): Promise<ApiInvoice[]> {
  const { data } = await api.get('/api/invoices');
  return (data.invoices || []) as ApiInvoice[];
}

type Row = { name: string; total: number; vat: number };

const numberFmt = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n || 0);

const YearTotalsBarChart: React.FC = () => {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', 'all-years'],
    queryFn: fetchAllInvoices,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const data = useMemo<Row[]>(() => {
    const byYear = new Map<number, { total: number; vat: number }>();
    (invoices || []).forEach(inv => {
      const vat = (inv.amount * (inv.tvaRate || 0)) / 100;
      const entry = byYear.get(inv.year) || { total: 0, vat: 0 };
      entry.total += inv.amount || 0;
      entry.vat += vat || 0;
      byYear.set(inv.year, entry);
    });
    const years = Array.from(byYear.keys()).sort((a, b) => a - b);
    return years.map(y => ({
      name: String(y),
      total: byYear.get(y)!.total,
      vat: byYear.get(y)!.vat,
    }));
  }, [invoices]);

  const hasAny = data.length > 0;

  return (
    <div className="w-full h-full" style={{ minHeight: 260 }}>
      {!hasAny && !isLoading ? (
        <div className="flex h-full min-h-60 items-center justify-center">
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            No invoices yet.
          </span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260} debounce={150}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={v => numberFmt(Number(v))} width={72} />
            <Tooltip
              formatter={(value: unknown, n) => [numberFmt(Number(value)) + ' DH', n as string]}
              labelFormatter={label => `Year ${label}`}
              contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              wrapperStyle={{ outline: 'none' }}
            />
            <Legend />
            <Bar dataKey="total" name="Total Price" fill="#0776c0" />
            <Bar dataKey="vat" name="Total VAT" fill="#fdc401" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default React.memo(YearTotalsBarChart);
