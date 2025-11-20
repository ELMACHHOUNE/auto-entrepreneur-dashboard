import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';

export interface ApiInvoiceAll {
  _id: string;
  year: number;
  month: string;
  quarter: 'T1' | 'T2' | 'T3' | 'T4';
  clientName: string;
  amount: number;
  tvaRate: number; // percentage value (e.g. 0.5, 1, 20)
}

async function fetchAllInvoices(): Promise<ApiInvoiceAll[]> {
  const { data } = await api.get('/api/invoices'); // no year param -> all user invoices
  return (data.invoices || []) as ApiInvoiceAll[];
}

export function useAllInvoices() {
  return useQuery({
    queryKey: ['invoices-all'],
    queryFn: () => fetchAllInvoices(),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
