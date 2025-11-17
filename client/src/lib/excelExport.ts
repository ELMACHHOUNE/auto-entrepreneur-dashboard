// Download helper with configurable MIME type
function downloadBlob(data: ArrayBuffer | string | Blob, fileName: string, type?: string) {
  const blob =
    data instanceof Blob
      ? data
      : new Blob([data], {
          type: type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function tryParseNumber(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  // Strip currency and NBSPs; keep digits, comma and dot and minus
  const cleaned = s.replace(/[\u00A0\u202F]/g, ' ').replace(/[^0-9,.-]+/g, '');
  if (!cleaned) return null;
  // If both comma and dot appear, assume dot is decimal if last dot is after last comma; else comma decimal
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  let normalized = cleaned;
  if (hasComma && !hasDot) {
    normalized = cleaned.replace(/,/g, '.');
  } else if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // comma decimal, remove thousand dots
      normalized = cleaned.replace(/\./g, '').replace(/,/g, '.');
    } else {
      // dot decimal, remove thousand commas
      normalized = cleaned.replace(/,/g, '');
    }
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export async function exportDataTableExcelFromElement(
  containerEl: HTMLElement,
  opts?: { fileName?: string; title?: string }
) {
  const table = containerEl.querySelector('table');
  if (!table) {
    console.warn('No table element found for Excel export');
    return;
  }
  // Gather headers and rows, excluding 'Actions'/'Action' columns to match PDF behavior
  const headerCells = Array.from(table.querySelectorAll('thead th')) as HTMLTableCellElement[];
  const rawHeaders = headerCells.map(th => (th.textContent || '').trim());
  const excludeNames = new Set(['actions', 'action']);
  const includedIndices: number[] = [];
  for (let i = 0; i < rawHeaders.length; i++) {
    const name = rawHeaders[i];
    if (!name) continue;
    if (!excludeNames.has(name.toLowerCase())) includedIndices.push(i);
  }
  const headers = includedIndices.map(i => rawHeaders[i]).filter(Boolean);
  const rows = Array.from(table.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
  const data: Array<Array<string | number>> = [];
  if (headers.length) data.push(headers);
  for (const tr of rows) {
    const cells = Array.from(tr.querySelectorAll('td')) as HTMLTableCellElement[];
    const vals: Array<string | number> = [];
    for (let ci = 0; ci < cells.length; ci++) {
      if (!includedIndices.includes(ci)) continue;
      const raw = (cells[ci].textContent || '').trim();
      const maybeNum = tryParseNumber(raw);
      vals.push(maybeNum !== null ? maybeNum : raw);
    }
    if (vals.some(v => String(v).length)) data.push(vals);
  }
  // Vulnerability mitigation: avoid xlsx library. Export as CSV (Excel-compatible).
  // Build CSV with proper escaping and UTF-8 BOM for Excel compatibility.
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    const needsQuotes = /[",\n\r]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };
  const lines = data.map(row => row.map(esc).join(','));
  const csv = '\uFEFF' + lines.join('\r\n');
  const fileName = (opts?.fileName || 'dashboard-table') + '.csv';
  downloadBlob(csv, fileName, 'text/csv;charset=utf-8');
}

// Fetch ALL invoices for the current user (optionally filtered by year) and build a styled workbook.
// This bypasses table pagination and includes every matching record from the API.
export async function exportAllInvoicesExcel(opts?: { fileName?: string; year?: number }) {
  // Delegate to styled export (ExcelJS) to avoid vulnerable xlsx dependency.
  return exportAllInvoicesExcelStyled(opts);
}

// Styled export using ExcelJS (supports reliable cell styling in community edition)
export async function exportAllInvoicesExcelStyled(opts?: { fileName?: string; year?: number }) {
  // Dynamic client-side styled export using ExcelJS.
  // Best practices applied:
  // 1. Dynamic import keeps initial bundle small.
  // 2. Robust namespace resolution for ESM/CJS builds.
  // 3. Ascending sort, explicit widths, number formats & frozen header.
  // 4. No global side-effects; all logic scoped.
  const [excelJsMod, axiosMod] = await Promise.all([import('exceljs'), import('@/api/axios')]);
  // Minimal ExcelJS namespace typing (only Workbook constructor needed for our usage).
  interface MinimalWorksheet {
    addRow: (values: unknown[]) => {
      height: number;
      eachCell: (cb: (cell: MinimalCell) => void) => void;
    };
    getRow: (row: number) => {
      font?: unknown;
      alignment?: unknown;
      height: number;
      eachCell: (cb: (cell: MinimalCell) => void) => void;
    };
    getColumn: (col: number) => {
      numFmt?: string;
      width?: number;
      eachCell: (cb: (cell: MinimalCell) => void) => void;
    };
    views: Array<Record<string, unknown>>;
    autoFilter: unknown;
  }
  interface MinimalCell {
    value?: unknown;
    fill?: unknown;
    border?: unknown;
  }
  interface MinimalWorkbook {
    addWorksheet: (name: string) => MinimalWorksheet;
    xlsx: { writeBuffer: () => Promise<ArrayBuffer> };
  }
  type ExcelWorkbookNamespace = { Workbook?: new () => MinimalWorkbook } & {
    default?: { Workbook?: new () => MinimalWorkbook };
  };
  const excelNs = excelJsMod as unknown as ExcelWorkbookNamespace;
  const ExcelNS = excelNs.Workbook ? excelNs : excelNs.default || excelNs;
  if (!ExcelNS.Workbook) {
    console.error('ExcelJS module did not expose Workbook');
    return;
  }
  const { api } = axiosMod as {
    api: {
      get: (
        url: string,
        cfg?: { params?: Record<string, string | number> }
      ) => Promise<{ data: unknown }>;
    };
  };
  const params: Record<string, string | number> = {};
  if (opts?.year) params.year = opts.year;
  const res = await api.get('/api/invoices', { params });
  type RawInvoice = {
    invoiceNumber: number;
    year: number;
    month: string;
    quarter?: string;
    clientName: string;
    amount: number;
    tvaRate: number;
  };
  const rawData = res.data as { invoices?: unknown };
  const invoices: RawInvoice[] = Array.isArray(rawData.invoices)
    ? (rawData.invoices as RawInvoice[])
    : [];
  invoices.sort((a, b) => a.invoiceNumber - b.invoiceNumber);
  const wb = new ExcelNS.Workbook();
  const ws = wb.addWorksheet('Invoices');
  const header = [
    'Invoice #',
    'Year',
    'Month',
    'Quarter',
    'Client',
    'Amount (DH)',
    'TVA Rate (%)',
    'TVA (DH)',
    'Net (DH)',
  ];
  ws.addRow(header);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 22;
  headerRow.eachCell((cell: { fill?: unknown; border?: unknown }) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF519D09' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF3F7A07' } },
      bottom: { style: 'thin', color: { argb: 'FF3F7A07' } },
    };
  });
  for (const inv of invoices) {
    const vat = (inv.amount * (inv.tvaRate || 0)) / 100;
    const net = inv.amount - vat;
    const row = ws.addRow([
      inv.invoiceNumber,
      inv.year,
      inv.month,
      inv.quarter ?? '',
      inv.clientName,
      inv.amount,
      inv.tvaRate,
      vat,
      net,
    ]);
    row.height = 20;
  }
  ws.getColumn(6).numFmt = '#,##0.00';
  ws.getColumn(7).numFmt = '0.00';
  ws.getColumn(8).numFmt = '#,##0.00';
  ws.getColumn(9).numFmt = '#,##0.00';
  const explicitWidthOverrides: Record<number, number> = {
    1: 12,
    2: 10,
    3: 14,
    4: 10,
    5: 32,
    6: 16,
    7: 12,
    8: 16,
    9: 16,
  };
  header.forEach((title, idx) => {
    const col = ws.getColumn(idx + 1);
    let maxContent = title.length;
    col.eachCell((cell: { value?: unknown }) => {
      const len = String(cell.value ?? '').length;
      if (len > maxContent) maxContent = len;
    });
    const computed = Math.min(Math.max(maxContent + 2, 10), 42);
    col.width = explicitWidthOverrides[idx + 1] || computed;
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: invoices.length + 1, column: header.length },
  };
  const fileName = opts?.fileName || `invoices-all${opts?.year ? '-' + opts.year : ''}.xlsx`;
  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(buf as ArrayBuffer, fileName);
}

// Prefetch helper to warm ExcelJS chunk (call on button hover/focus/idle)
let excelJsPrefetching: Promise<void> | null = null;
export function prefetchStyledExcelExport() {
  if (excelJsPrefetching) return excelJsPrefetching;
  excelJsPrefetching = (async () => {
    try {
      await import('exceljs');
    } catch (e) {
      console.warn('ExcelJS prefetch failed', e);
    }
  })();
  return excelJsPrefetching;
}
