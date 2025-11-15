import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/api/axios';

export type YearStat = { year: number; count: number };
export type YearPoint = { name: string; count: number };
export type CategoryStat = { category: string; count: number };
export type CategoryPoint = { name: string; count: number };

const STALE = 60_000;
const GC = 5 * 60_000;
const commonOpts = { staleTime: STALE, gcTime: GC, refetchOnWindowFocus: false } as const;

export function useAdminUsersTotal(options?: UseQueryOptions<number, Error, number>) {
  return useQuery<number, Error, number>({
    queryKey: ['admin', 'users', 'stats', 'total'],
    async queryFn() {
      const { data } = await api.get('/api/admin/users/stats/count');
      return Number(data?.total || 0);
    },
    ...commonOpts,
    ...(options || {}),
  });
}

export function useAdminUsersYearly(options?: UseQueryOptions<YearPoint[], Error, YearPoint[]>) {
  return useQuery<YearPoint[], Error, YearPoint[]>({
    queryKey: ['admin', 'users', 'stats', 'yearly'],
    async queryFn() {
      const { data } = await api.get('/api/admin/users/stats/yearly');
      const items = (data?.items || []) as YearStat[];
      return items
        .slice()
        .sort((a, b) => a.year - b.year)
        .map(r => ({ name: String(r.year), count: r.count }));
    },
    ...commonOpts,
    ...(options || {}),
  });
}

function labelCategory(v: string) {
  return v === 'guide_auto_entrepreneur'
    ? 'Auto-entrepreneur'
    : v === 'company_guide'
    ? 'Entreprise'
    : 'Inconnu';
}

export function useAdminUsersByCategory(
  options?: UseQueryOptions<CategoryPoint[], Error, CategoryPoint[]>
) {
  return useQuery<CategoryPoint[], Error, CategoryPoint[]>({
    queryKey: ['admin', 'users', 'stats', 'by-category'],
    async queryFn() {
      const { data } = await api.get('/api/admin/users/stats/by-category');
      const items = (data?.items || []) as CategoryStat[];
      return items.map(r => ({ name: labelCategory(r.category), count: r.count }));
    },
    ...commonOpts,
    ...(options || {}),
  });
}
