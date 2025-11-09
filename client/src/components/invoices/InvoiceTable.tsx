import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Select, TextInput, Modal, Group, ActionIcon, Tooltip } from '@mantine/core';
import { DataTable } from '@/components/table/DataTable';
import type { MRT_ColumnDef } from 'mantine-react-table';
import { Pencil, Trash2 } from 'lucide-react';

// TVA is now a free numeric input (supports comma), so predefined rates array removed.

// French months
const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

type Month = (typeof MONTHS)[number];

function monthToQuarterByName(month: Month): 'T1' | 'T2' | 'T3' | 'T4' {
  const idx = MONTHS.indexOf(month);
  if (idx < 3) return 'T1';
  if (idx < 6) return 'T2';
  if (idx < 9) return 'T3';
  return 'T4';
}

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  year: number;
  month: Month;
  quarter: 'T1' | 'T2' | 'T3' | 'T4';
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
    onePercent: { T1: number; T2: number; T3: number; T4: number };
  }) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  year: externalYear,
  onQuarterSummaryChange,
}) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(externalYear || currentYear);

  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  // Add Invoice modal
  const [addOpen, setAddOpen] = useState(false);
  const [invMonth, setInvMonth] = useState<Month>(MONTHS[new Date().getMonth()] || 'Janvier');
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

  const rowsForYear = useMemo(() => invoices.filter(i => i.year === year), [invoices, year]);

  // Totals removed from toolbar per request; keep summary via onQuarterSummaryChange only.

  useEffect(() => {
    if (!onQuarterSummaryChange) return;
    const buckets: { T1: number; T2: number; T3: number; T4: number } = {
      T1: 0,
      T2: 0,
      T3: 0,
      T4: 0,
    };
    rowsForYear.forEach(r => {
      buckets[r.quarter] += r.amount;
    });
    const onePercent = {
      T1: parseFloat((buckets.T1 * 0.01).toFixed(2)),
      T2: parseFloat((buckets.T2 * 0.01).toFixed(2)),
      T3: parseFloat((buckets.T3 * 0.01).toFixed(2)),
      T4: parseFloat((buckets.T4 * 0.01).toFixed(2)),
    } as const;
    onQuarterSummaryChange({ year, totals: buckets, onePercent });
  }, [rowsForYear, year, onQuarterSummaryChange]);

  const addInvoice = useCallback(() => {
    const amount = parseFloat(invAmount || '0');
    if (!invNumber.trim() || !invClient.trim() || !amount) {
      setAddOpen(false);
      return;
    }
    const tvaRateNum = parseTvaRate(invTvaRateInput);
    const newRow: InvoiceRow = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      invoiceNumber: invNumber.trim(),
      year: invYear,
      month: invMonth,
      quarter: monthToQuarterByName(invMonth),
      clientName: invClient.trim(),
      amount,
      tvaRate: tvaRateNum,
    };
    setInvoices(prev => [newRow, ...prev]);
    setAddOpen(false);
    // reset
    setInvClient('');
    setInvNumber('');
    setInvAmount('');
    setInvTvaRateInput('1');
    setInvYear(year);
  }, [invNumber, invClient, invAmount, invTvaRateInput, invMonth, invYear, year, parseTvaRate]);

  const startEdit = useCallback((row: InvoiceRow) => {
    setEditDraft({ ...row });
    setEditOpen(true);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editDraft) return;
    setInvoices(prev => prev.map(r => (r.id === editDraft.id ? { ...editDraft } : r)));
    setEditOpen(false);
    setEditDraft(null);
  }, [editDraft]);

  const deleteRow = useCallback((row: InvoiceRow) => {
    if (typeof window !== 'undefined' && !window.confirm('Supprimer cette facture ?')) return;
    setInvoices(prev => prev.filter(r => r.id !== row.id));
  }, []);

  const columns = useMemo<MRT_ColumnDef<InvoiceRow>[]>(
    () => [
      { accessorKey: 'invoiceNumber', header: 'Numéro de facture', size: 150 },
      { accessorKey: 'quarter', header: 'Trimestre', size: 80 },
      { accessorKey: 'year', header: 'Année', size: 80 },
      { accessorKey: 'month', header: 'Mois', size: 120 },
      { accessorKey: 'clientName', header: 'Client', size: 160 },
      {
        id: 'amount',
        header: 'Prix Total',
        accessorFn: row => row.amount,
        Cell: ({ row }) => (
          <span style={{ fontWeight: 500 }}>{row.original.amount.toLocaleString('fr-MA')} DH</span>
        ),
        size: 120,
      },
      {
        id: 'tvaRate',
        header: 'TVA %',
        accessorFn: row => row.tvaRate,
        Cell: ({ row }) => <span>{row.original.tvaRate}%</span>,
        size: 80,
      },
      {
        id: 'tvaAmount',
        header: 'TVA Montant',
        accessorFn: row => computeTvaAmount(row),
        Cell: ({ row }) => <span>{computeTvaAmount(row.original).toLocaleString('fr-MA')} DH</span>,
        size: 120,
      },
    ],
    []
  );

  return (
    <div className="space-y-3">
      <DataTable<InvoiceRow>
        columns={columns}
        data={rowsForYear}
        borderTone="accent"
        enableRowActions
        renderRowActions={({ row }) => (
          <Group gap={4}>
            <Tooltip label="Modifier">
              <ActionIcon variant="subtle" onClick={() => startEdit(row.original)}>
                <Pencil size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Supprimer">
              <ActionIcon color="red" variant="subtle" onClick={() => deleteRow(row.original)}>
                <Trash2 size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
        renderTopToolbarCustomActions={() => (
          <div className="w-full grid grid-cols-3 items-center gap-2">
            <div className="justify-self-start">
              <Button
                size="xs"
                onClick={() => {
                  setInvYear(year);
                  setAddOpen(true);
                }}
              >
                Ajouter une facture
              </Button>
            </div>
            <div className="justify-self-center text-xs text-muted-foreground">
              Factures: <strong>{rowsForYear.length}</strong>
            </div>
            <div className="justify-self-end">
              <Select
                placeholder="Année"
                size="xs"
                value={year.toString()}
                data={[year - 1, year, year + 1].map(y => ({
                  value: y.toString(),
                  label: y.toString(),
                }))}
                onChange={v => setYear(parseInt(v || year.toString(), 10))}
                style={{ width: 110 }}
              />
            </div>
          </div>
        )}
      />

      {/* Add Invoice Modal */}
      <Modal
        opened={addOpen}
        onClose={() => setAddOpen(false)}
        title="Ajouter une facture"
        size="md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextInput
            label="Numéro de facture"
            value={invNumber}
            onChange={e => setInvNumber(e.currentTarget.value)}
          />
          <TextInput
            label="Nom du client"
            value={invClient}
            onChange={e => setInvClient(e.currentTarget.value)}
          />
          <Select
            label="Mois"
            data={MONTHS.map(m => ({ value: m, label: m }))}
            value={invMonth}
            onChange={v => setInvMonth((v as Month) || 'Janvier')}
          />
          <Select
            label="Année"
            data={[year - 1, year, year + 1].map(y => ({
              value: y.toString(),
              label: y.toString(),
            }))}
            value={invYear.toString()}
            onChange={v => setInvYear(parseInt(v || year.toString(), 10))}
          />
          <TextInput
            label="Montant (DH)"
            type="number"
            value={invAmount}
            onChange={e => setInvAmount(e.currentTarget.value)}
          />
          <TextInput
            label="TVA %"
            description="Tapez une valeur libre (ex: 0,5 ou 20)"
            value={invTvaRateInput}
            onChange={e => setInvTvaRateInput(e.currentTarget.value)}
            onBlur={e => {
              // Normalize formatting on blur (optional)
              const num = parseTvaRate(e.currentTarget.value);
              setInvTvaRateInput(num.toString());
            }}
          />
        </div>
        <Group mt="md" justify="flex-end">
          <Button size="xs" variant="default" onClick={() => setAddOpen(false)}>
            Annuler
          </Button>
          <Button size="xs" onClick={addInvoice}>
            Ajouter
          </Button>
        </Group>
      </Modal>

      {/* Edit Invoice Modal */}
      <Modal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        title="Modifier la facture"
        size="md"
      >
        {editDraft && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextInput
              label="Numéro de facture"
              value={editDraft.invoiceNumber as string}
              onChange={e => setEditDraft({ ...editDraft, invoiceNumber: e.currentTarget.value })}
            />
            <TextInput
              label="Nom du client"
              value={editDraft.clientName as string}
              onChange={e => setEditDraft({ ...editDraft, clientName: e.currentTarget.value })}
            />
            <Select
              label="Mois"
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
            />
            <Select
              label="Année"
              data={[year - 1, year, year + 1].map(y => ({
                value: y.toString(),
                label: y.toString(),
              }))}
              value={editDraft.year.toString()}
              onChange={v =>
                setEditDraft(d => (d ? { ...d, year: parseInt(v || d.year.toString(), 10) } : d))
              }
            />
            <TextInput
              label="Montant (DH)"
              type="number"
              value={String(editDraft.amount)}
              onChange={e =>
                setEditDraft({ ...editDraft, amount: parseFloat(e.currentTarget.value || '0') })
              }
            />
            <TextInput
              label="TVA %"
              description="Tapez une valeur libre (ex: 0,5 ou 20)"
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
            />
          </div>
        )}
        <Group mt="md" justify="flex-end">
          <Button size="xs" variant="default" onClick={() => setEditOpen(false)}>
            Annuler
          </Button>
          <Button size="xs" onClick={saveEdit}>
            Enregistrer
          </Button>
        </Group>
      </Modal>
    </div>
  );
};

export default InvoiceTable;
