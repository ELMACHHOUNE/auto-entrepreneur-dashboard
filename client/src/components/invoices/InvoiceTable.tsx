import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Select,
  TextInput,
  Modal,
  Group,
  ActionIcon,
  Tooltip,
  Autocomplete,
} from '@mantine/core';
import {
  selectFilledStyles,
  inputFilledStyles,
  buttonAccentStyles,
  buttonNeutralStyles,
  modalStyles,
} from '@/components/ui/mantineStyles';
import { DataTable } from '@/components/table/DataTable';
import { api } from '@/api/axios';
import type { MRT_ColumnDef } from 'mantine-react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { MONTHS, monthToQuarterByName } from '@/lib/dateBuckets';
import type { Month, QuarterKey } from '@/lib/dateBuckets';

// TVA is now a free numeric input (supports comma), so predefined rates array removed.

export interface InvoiceRow {
  id: string;
  invoiceNumber: number;
  year: number;
  month: Month;
  quarter: QuarterKey;
  clientName: string;
  amount: number; // Prix Total for this invoice
  tvaRate: number; // 0.5 | 1 | 20
  [key: string]: unknown;
}

function computeTvaAmount(row: InvoiceRow) {
  return parseFloat(((row.amount * row.tvaRate) / 100).toFixed(2));
}

interface InvoiceTableProps {
  year?: number;
  onQuarterSummaryChange?: (summary: {
    year: number;
    totals: { T1: number; T2: number; T3: number; T4: number };
    // Keep per-quarter totals; percentage amounts can be computed by consumer using a selected rate
    // Provide yearly rollups for convenience
    totalYearAmount: number;
    totalYearTva: number;
  }) => void;
  onMonthlyTotalsChange?: (
    rows: Array<{ month: Month; gross: number; vat: number; net: number }>
  ) => void;
  onClientCountsChange?: (rows: Array<{ name: string; count: number }>) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  year: externalYear,
  onQuarterSummaryChange,
  onMonthlyTotalsChange,
  onClientCountsChange,
}) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(externalYear || currentYear);

  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  // Add Invoice modal
  const [addOpen, setAddOpen] = useState(false);
  const [invMonth, setInvMonth] = useState<Month>(MONTHS[new Date().getMonth()] || 'January');
  const [invYear, setInvYear] = useState<number>(year);
  const [invClient, setInvClient] = useState('');
  const [invNumber, setInvNumber] = useState('');
  const [invAmount, setInvAmount] = useState('');
  // Free-form TVA input (accepts comma or dot). We'll store the raw string separately and parse when saving.
  const [invTvaRateInput, setInvTvaRateInput] = useState<string>('1');

  // Helper to parse TVA input to a bounded numeric rate (0 - 100)
  const parseTvaRate = useCallback((raw: string): number => {
    if (!raw) return 0;
    // Replace comma with dot, keep digits and at most one dot
    const cleaned = raw
      .replace(/,/g, '.')
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./, '$1'); // keep first dot only
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return Math.min(100, Math.max(0, parseFloat(num.toFixed(3))));
  }, []);

  // Edit Invoice modal
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<InvoiceRow | null>(null);

  // Autofocus refs for better UX
  const addFirstFieldRef = useRef<HTMLInputElement | null>(null);
  const editFirstFieldRef = useRef<HTMLInputElement | null>(null);

  const rowsForYear = useMemo(() => invoices.filter(i => i.year === year), [invoices, year]);

  // Unique client names from loaded invoices (used for suggestions in the Client Name field)
  const clientSuggestions = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(i => {
      const n = (i.clientName || '').trim();
      if (n) set.add(n);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [invoices]);

  // Totals removed from toolbar per request; keep summary via onQuarterSummaryChange only.

  useEffect(() => {
    if (!onQuarterSummaryChange) return;
    const buckets: { T1: number; T2: number; T3: number; T4: number } = {
      T1: 0,
      T2: 0,
      T3: 0,
      T4: 0,
    };
    let totalYearAmount = 0;
    let totalYearTva = 0;
    rowsForYear.forEach(r => {
      buckets[r.quarter] += r.amount;
      totalYearAmount += r.amount;
      totalYearTva += computeTvaAmount(r);
    });
    totalYearAmount = parseFloat(totalYearAmount.toFixed(2));
    totalYearTva = parseFloat(totalYearTva.toFixed(2));
    onQuarterSummaryChange({ year, totals: buckets, totalYearAmount, totalYearTva });
  }, [rowsForYear, year, onQuarterSummaryChange]);

  // Compute monthly gross, VAT, net and notify parent when requested
  useEffect(() => {
    if (!onMonthlyTotalsChange) return;
    const init = MONTHS.map(m => ({ month: m, gross: 0, vat: 0, net: 0 }));
    const byMonth = new Map<string, { month: Month; gross: number; vat: number; net: number }>(
      init.map(r => [r.month, { ...r }])
    );
    rowsForYear.forEach(r => {
      const entry = byMonth.get(r.month) as {
        month: Month;
        gross: number;
        vat: number;
        net: number;
      };
      const vat = computeTvaAmount(r);
      entry.gross += r.amount;
      entry.vat += vat;
      entry.net += r.amount - vat;
    });
    // Keep raw precision; handle rounding only at display time in charts/UI
    const result = MONTHS.map(m => byMonth.get(m)!).map(r => ({
      month: r.month,
      gross: r.gross,
      vat: r.vat,
      net: r.net,
    }));
    onMonthlyTotalsChange(result);
  }, [rowsForYear, onMonthlyTotalsChange]);

  // Compute number of invoices per client (for radar chart) and notify parent
  useEffect(() => {
    if (!onClientCountsChange) return;
    const map = new Map<string, number>();
    rowsForYear.forEach(r => {
      const key = (r.clientName || 'Unknown').trim();
      map.set(key, (map.get(key) || 0) + 1);
    });
    const arr = Array.from(map.entries()).map(([name, count]) => ({ name, count }));
    onClientCountsChange(arr);
  }, [rowsForYear, onClientCountsChange]);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get('/api/invoices', { params: { year } });
      // map API invoices to local InvoiceRow
      type ApiInvoice = {
        _id: string;
        invoiceNumber: number;
        year: number;
        month: Month;
        quarter: 'T1' | 'T2' | 'T3' | 'T4';
        clientName: string;
        amount: number;
        tvaRate: number;
      };
      const mapped: InvoiceRow[] =
        (data.invoices as ApiInvoice[] | undefined)?.map(doc => ({
          id: doc._id,
          invoiceNumber: doc.invoiceNumber,
          year: doc.year,
          month: doc.month,
          quarter: doc.quarter,
          clientName: doc.clientName,
          amount: doc.amount,
          tvaRate: doc.tvaRate,
        })) || [];
      setInvoices(mapped);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const addInvoice = useCallback(async () => {
    const amount = parseFloat(invAmount || '0');
    const parsedInvNumber = parseInt(invNumber, 10);
    if (isNaN(parsedInvNumber) || !invClient.trim() || !amount) {
      setAddOpen(false);
      return;
    }
    const tvaRateNum = parseTvaRate(invTvaRateInput);
    try {
      await api.post('/api/invoices', {
        invoiceNumber: parsedInvNumber,
        year: invYear,
        month: invMonth,
        clientName: invClient.trim(),
        amount,
        tvaRate: tvaRateNum,
      });
      await fetchInvoices();
      await queryClient.invalidateQueries({ queryKey: ['invoices'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['invoices-all'], exact: false });
    } catch {
      // optionally surface error UI; we keep silent for now
    } finally {
      setAddOpen(false);
      setInvClient('');
      setInvNumber('');
      setInvAmount('');
      setInvTvaRateInput('1');
      setInvYear(year);
    }
  }, [
    invNumber,
    invClient,
    invAmount,
    invTvaRateInput,
    invMonth,
    invYear,
    year,
    parseTvaRate,
    fetchInvoices,
    queryClient,
  ]);

  const startEdit = useCallback((row: InvoiceRow) => {
    setEditDraft({ ...row });
    setEditOpen(true);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editDraft) return;
    try {
      await api.patch(`/api/invoices/${editDraft.id}`, {
        invoiceNumber: editDraft.invoiceNumber,
        year: editDraft.year,
        month: editDraft.month,
        clientName: editDraft.clientName,
        amount: editDraft.amount,
        tvaRate: editDraft.tvaRate,
      });
      await fetchInvoices();
      await queryClient.invalidateQueries({ queryKey: ['invoices'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['invoices-all'], exact: false });
    } catch {
      // silent for now
    } finally {
      setEditOpen(false);
      setEditDraft(null);
    }
  }, [editDraft, fetchInvoices, queryClient]);

  const deleteRow = useCallback(
    async (row: InvoiceRow) => {
      if (typeof window !== 'undefined' && !window.confirm('Delete this invoice?')) return;
      try {
        await api.delete(`/api/invoices/${row.id}`);
        await fetchInvoices();
        await queryClient.invalidateQueries({ queryKey: ['invoices'], exact: false });
        await queryClient.invalidateQueries({ queryKey: ['invoices-all'], exact: false });
      } catch {
        // silent
      }
    },
    [fetchInvoices, queryClient]
  );

  // Focus first input when modals open
  useEffect(() => {
    if (addOpen) {
      // next tick to ensure Modal content mounted
      setTimeout(() => addFirstFieldRef.current?.focus(), 0);
    }
  }, [addOpen]);
  useEffect(() => {
    if (editOpen) {
      setTimeout(() => editFirstFieldRef.current?.focus(), 0);
    }
  }, [editOpen]);

  const columns = useMemo<MRT_ColumnDef<InvoiceRow>[]>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: t('components.invoiceTable.columns.invoiceNo'),
        size: 150,
      },
      { accessorKey: 'quarter', header: t('components.invoiceTable.columns.quarter'), size: 80 },
      { accessorKey: 'year', header: t('components.invoiceTable.columns.year'), size: 80 },
      { accessorKey: 'month', header: t('components.invoiceTable.columns.month'), size: 120 },
      { accessorKey: 'clientName', header: t('components.invoiceTable.columns.client'), size: 160 },
      {
        id: 'amount',
        header: t('components.invoiceTable.columns.totalAmount'),
        accessorFn: row => row.amount,
        Cell: ({ row }) => (
          <span style={{ fontWeight: 500 }}>
            {row.original.amount.toLocaleString(i18n.language)} DH
          </span>
        ),
        size: 120,
      },
      {
        id: 'tvaRate',
        header: t('components.invoiceTable.columns.vatPercent'),
        accessorFn: row => row.tvaRate,
        Cell: ({ row }) => <span>{row.original.tvaRate}%</span>,
        size: 80,
      },
      {
        id: 'tvaAmount',
        header: t('components.invoiceTable.columns.vatAmount'),
        accessorFn: row => computeTvaAmount(row),
        Cell: ({ row }) => (
          <span>{computeTvaAmount(row.original).toLocaleString(i18n.language)} DH</span>
        ),
        size: 120,
      },
    ],
    [t, i18n.language]
  );

  // Provide a wider, scrollable year range and render dropdowns in a portal to avoid clipping
  const yearOptions = useMemo(() => {
    const cy = new Date().getFullYear();
    const start = cy - 15; // past 15 years
    const end = cy + 5; // a few years ahead
    const arr: { value: string; label: string }[] = [];
    for (let y = start; y <= end; y++) arr.push({ value: String(y), label: String(y) });
    return arr.reverse(); // show recent years first
  }, []);

  return (
    <div className="space-y-3">
      {/** Reusable token-aligned styles for Selects to match table/search inputs (applied inline below) */}
      <DataTable<InvoiceRow>
        columns={columns}
        data={rowsForYear}
        loading={loading}
        error={error}
        borderTone="accent"
        groupByKey={r => r.quarter}
        groupOrder={['T1', 'T2', 'T3', 'T4']}
        groupWithinComparator={(a, b) => a.invoiceNumber - b.invoiceNumber}
        groupSeparatorTone="accent"
        enableRowActions
        renderRowActions={({ row }) => (
          <Group gap={4}>
            <Tooltip label={t('components.invoiceTable.actions.edit')}>
              <ActionIcon variant="subtle" onClick={() => startEdit(row.original)}>
                <Pencil size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('components.invoiceTable.actions.delete')}>
              <ActionIcon color="red" variant="subtle" onClick={() => deleteRow(row.original)}>
                <Trash2 size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
        renderTopToolbarCustomActions={() => (
          <div className="relative flex w-full flex-col gap-2 pr-2 sm:flex-row sm:items-center sm:gap-3">
            {/* Row 1 / Left cluster (stacks on mobile) */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="xs"
                styles={buttonAccentStyles}
                onClick={() => {
                  setInvYear(year);
                  setAddOpen(true);
                }}
                className="min-w-[110px]"
              >
                {t('components.invoiceTable.toolbar.addInvoice')}
              </Button>
              <Select
                placeholder={t('components.invoiceTable.toolbar.yearPlaceholder')}
                size="xs"
                value={year.toString()}
                data={yearOptions}
                onChange={v => setYear(parseInt(v || year.toString(), 10))}
                variant="filled"
                styles={selectFilledStyles}
                className="w-[110px]"
                comboboxProps={{ withinPortal: true }}
                maxDropdownHeight={260}
              />
            </div>
            {/* Invoice count pill: inline on mobile, centered overlay on larger screens */}
            <div
              className="order-3 sm:order-0 select-none sm:pointer-events-none sm:absolute sm:left-1/2 sm:-translate-x-1/2"
              aria-live="polite"
              aria-atomic
            >
              <span
                className="inline-flex items-center justify-center rounded-md bg-accent/60 px-4 py-1.5 text-sm sm:text-base font-semibold leading-none tracking-wide text-accent-foreground shadow-sm backdrop-blur-sm"
                title={t('components.invoiceTable.toolbar.invoicesPillTitle')}
              >
                {t('components.invoiceTable.toolbar.invoicesLabel')}&nbsp;
                <span className="tabular-nums">
                  {rowsForYear.length.toLocaleString(i18n.language)}
                </span>
              </span>
            </div>
            {/* Spacer to push built-in MRT controls (search, column visibility) to the end on larger screens */}
            <div className="flex-1 sm:ml-auto" />
          </div>
        )}
      />

      {/* Add Invoice Modal */}
      <Modal
        opened={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('components.invoiceTable.addModal.title')}
        size="md"
        radius="md"
        shadow="md"
        overlayProps={{ opacity: 0.35, blur: 2 }}
        styles={modalStyles.success}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextInput
            label={t('components.invoiceTable.addModal.labels.invoiceNo')}
            type="number"
            value={invNumber}
            onChange={e => setInvNumber(e.currentTarget.value)}
            ref={addFirstFieldRef}
            variant="filled"
            styles={inputFilledStyles}
          />
          <Autocomplete
            label={t('components.invoiceTable.addModal.labels.clientName')}
            data={clientSuggestions}
            value={invClient}
            onChange={setInvClient}
            placeholder={
              clientSuggestions.length
                ? t('components.invoiceTable.addModal.placeholders.clientTyping')
                : t('components.invoiceTable.addModal.placeholders.clientEnter')
            }
            variant="filled"
            styles={selectFilledStyles}
            comboboxProps={{ withinPortal: true }}
            maxDropdownHeight={220}
            limit={15}
          />
          <Select
            label={t('components.invoiceTable.addModal.labels.month')}
            data={MONTHS.map(m => ({ value: m, label: m }))}
            value={invMonth}
            onChange={v => setInvMonth((v as Month) || 'January')}
            variant="filled"
            styles={selectFilledStyles}
          />
          <Select
            label={t('components.invoiceTable.addModal.labels.year')}
            data={yearOptions}
            value={invYear.toString()}
            onChange={v => setInvYear(parseInt(v || year.toString(), 10))}
            variant="filled"
            styles={selectFilledStyles}
            comboboxProps={{ withinPortal: true }}
            maxDropdownHeight={260}
          />
          <TextInput
            label={t('components.invoiceTable.addModal.labels.amountDh')}
            type="number"
            value={invAmount}
            onChange={e => setInvAmount(e.currentTarget.value)}
            variant="filled"
            styles={inputFilledStyles}
          />
          <TextInput
            label={t('components.invoiceTable.addModal.labels.vatPercent')}
            type="number"
            description={t('components.invoiceTable.addModal.descriptions.vatHelp')}
            value={invTvaRateInput}
            onChange={e => setInvTvaRateInput(e.currentTarget.value)}
            onBlur={e => {
              // Normalize formatting on blur (optional)
              const num = parseTvaRate(e.currentTarget.value);
              setInvTvaRateInput(num.toString());
            }}
            variant="filled"
            styles={inputFilledStyles}
          />
        </div>
        <Group mt="md" justify="flex-end" gap="xs">
          <Button
            size="xs"
            variant="outline"
            styles={buttonNeutralStyles}
            onClick={() => setAddOpen(false)}
          >
            {t('components.invoiceTable.addModal.cancel')}
          </Button>
          <Button size="xs" styles={buttonAccentStyles} onClick={addInvoice}>
            {t('components.invoiceTable.addModal.submit')}
          </Button>
        </Group>
      </Modal>

      {/* Edit Invoice Modal */}
      <Modal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('components.invoiceTable.editModal.title')}
        size="md"
        radius="md"
        shadow="md"
        overlayProps={{ opacity: 0.35, blur: 2 }}
        styles={modalStyles.accent}
      >
        {editDraft && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextInput
              label={t('components.invoiceTable.addModal.labels.invoiceNo')}
              type="number"
              value={String(editDraft.invoiceNumber)}
              onChange={e => {
                const v = parseInt(e.currentTarget.value, 10);
                setEditDraft(d =>
                  d ? { ...d, invoiceNumber: isNaN(v) ? d.invoiceNumber : v } : d
                );
              }}
              ref={editFirstFieldRef}
              variant="filled"
              styles={inputFilledStyles}
            />
            <Autocomplete
              label={t('components.invoiceTable.addModal.labels.clientName')}
              data={clientSuggestions}
              value={editDraft.clientName as string}
              onChange={v => setEditDraft(d => (d ? { ...d, clientName: v } : d))}
              placeholder={
                clientSuggestions.length
                  ? t('components.invoiceTable.addModal.placeholders.clientTyping')
                  : t('components.invoiceTable.addModal.placeholders.clientEnter')
              }
              variant="filled"
              styles={selectFilledStyles}
              comboboxProps={{ withinPortal: true }}
              maxDropdownHeight={220}
              limit={15}
            />
            <Select
              label={t('components.invoiceTable.addModal.labels.month')}
              data={MONTHS.map(m => ({ value: m, label: m }))}
              value={editDraft.month as Month}
              onChange={v =>
                setEditDraft(d =>
                  d
                    ? {
                        ...d,
                        month: (v as Month) || d.month,
                        quarter: monthToQuarterByName((v as Month) || d.month),
                      }
                    : d
                )
              }
              variant="filled"
              styles={selectFilledStyles}
            />
            <Select
              label={t('components.invoiceTable.addModal.labels.year')}
              data={yearOptions}
              value={editDraft.year.toString()}
              onChange={v =>
                setEditDraft(d => (d ? { ...d, year: parseInt(v || d.year.toString(), 10) } : d))
              }
              variant="filled"
              styles={selectFilledStyles}
              comboboxProps={{ withinPortal: true }}
              maxDropdownHeight={260}
            />
            <TextInput
              label={t('components.invoiceTable.addModal.labels.amountDh')}
              type="number"
              value={String(editDraft.amount)}
              onChange={e =>
                setEditDraft({ ...editDraft, amount: parseFloat(e.currentTarget.value || '0') })
              }
              variant="filled"
              styles={inputFilledStyles}
            />
            <TextInput
              label={t('components.invoiceTable.addModal.labels.vatPercent')}
              description={t('components.invoiceTable.addModal.descriptions.vatHelp')}
              value={String(editDraft.tvaRate)}
              onChange={e => {
                const raw = e.currentTarget.value;
                const num = parseTvaRate(raw);
                setEditDraft({ ...editDraft, tvaRate: num });
              }}
              onBlur={e => {
                const num = parseTvaRate(e.currentTarget.value);
                setEditDraft(d => (d ? { ...d, tvaRate: num } : d));
              }}
              variant="filled"
              styles={inputFilledStyles}
            />
          </div>
        )}
        <Group mt="md" justify="flex-end" gap="xs">
          <Button
            size="xs"
            variant="outline"
            styles={buttonNeutralStyles}
            onClick={() => setEditOpen(false)}
          >
            {t('components.invoiceTable.editModal.cancel')}
          </Button>
          <Button size="xs" styles={buttonAccentStyles} onClick={saveEdit}>
            {t('components.invoiceTable.editModal.saveChanges')}
          </Button>
        </Group>
      </Modal>
    </div>
  );
};

export default InvoiceTable;
