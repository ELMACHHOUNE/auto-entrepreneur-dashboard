import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import type { Month, QuarterKey } from '@/lib/dateBuckets';

export interface ApiInvoice {
  _id: string;
  year: number;
  month: Month;
  clientName: string;
  amount: number;
  quarter: QuarterKey;
  tvaRate: number;
}

async function fetchInvoices(year: number): Promise<ApiInvoice[]> {
  const { data } = await api.get('/api/invoices', { params: { year } });
  return (data.invoices || []) as ApiInvoice[];
}

export function useInvoicesByYear(year: number) {
  return useQuery({
    queryKey: ['invoices', year],
    queryFn: () => fetchInvoices(year),
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
