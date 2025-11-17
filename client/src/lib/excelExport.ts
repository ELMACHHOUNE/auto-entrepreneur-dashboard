// Lightweight Excel export using SheetJS (xlsx). Loaded dynamically to keep bundle small.

function downloadBlob(data: ArrayBuffer, fileName: string) {
  const blob = new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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

  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Auto-filter for the header row
  if (data.length) {
    const ref = ws['!ref'] as string | undefined;
    if (ref) {
      const range = XLSX.utils.decode_range(ref);
      (ws as Record<string, unknown>)['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
    }
  }
  // Column widths based on max cell length (coarse)
  if (data.length) {
    const colCount = Math.max(...data.map(r => r.length));
    const widths = new Array(colCount).fill(10).map((_, i) => {
      const maxLen = Math.max(...data.map(r => (r[i] !== undefined ? String(r[i]).length : 0)));
      // approx width: characters + some padding
      return { wch: Math.min(Math.max(maxLen + 2, 8), 40) };
    });
    (ws as Record<string, unknown>)['!cols'] = widths as unknown;
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  const fileName = opts?.fileName || 'dashboard-table.xlsx';
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(buf, fileName);
}

// Fetch ALL invoices for the current user (optionally filtered by year) and build a styled workbook.
// This bypasses table pagination and includes every matching record from the API.
export async function exportAllInvoicesExcel(opts?: { fileName?: string; year?: number }) {
  // Dynamic import; SheetJS sometimes exposes its namespace directly rather than under default
  const [xlsxMod, axiosMod] = await Promise.all([import('xlsx'), import('@/api/axios')]);
  // SheetJS CE exposes namespace either directly or under default; discriminate without using 'any'
  // Minimal typings for the subset we use of SheetJS utils
  interface Worksheet {
    [key: string]: unknown;
    '!ref'?: string;
  }
  interface Workbook {
    Sheets: Record<string, Worksheet>;
    SheetNames: string[];
  }
  interface XlsxUtils {
    book_new: () => Workbook;
    aoa_to_sheet: (data: (string | number)[][]) => Worksheet;
    encode_cell: (addr: { r: number; c: number }) => string;
    decode_range: (ref: string) => unknown;
    encode_range: (r: unknown) => string;
    book_append_sheet: (wb: Workbook, ws: Worksheet, name: string) => void;
  }
  type XlsxNamespace = {
    utils?: XlsxUtils;
    write?: (wb: Workbook, opts: { type: string; bookType: string }) => ArrayBuffer;
  } & Record<string, unknown>;
  const nsCandidate: XlsxNamespace = xlsxMod as XlsxNamespace;
  const defaultCandidate: XlsxNamespace = (xlsxMod as Record<string, unknown>)
    .default as XlsxNamespace;
  const XLSX: XlsxNamespace =
    defaultCandidate && defaultCandidate.utils ? defaultCandidate : nsCandidate;
  if (!XLSX.utils) {
    console.error('xlsx module did not expose utils as expected:', xlsxMod);
    throw new Error('Failed to load xlsx utils');
  }
  interface ApiModule {
    api: {
      get: (
        url: string,
        cfg?: { params?: Record<string, string | number> }
      ) => Promise<{ data: unknown }>;
    };
  }
  const { api } = axiosMod as ApiModule;
  const params: Record<string, string | number> = {};
  if (opts?.year) params.year = opts.year;
  const res = await api.get('/api/invoices', { params });
  type RawInvoice = {
    invoiceNumber: number;
    year: number;
    month: string;
    quarter: string;
    clientName: string;
    amount: number;
    tvaRate: number;
    createdAt?: string;
  };
  const invoices: RawInvoice[] = Array.isArray((res.data as { invoices?: unknown })?.invoices)
    ? ((res.data as { invoices?: unknown })?.invoices as RawInvoice[])
    : [];
  // Sort ascending by invoiceNumber for structured order
  invoices.sort((a, b) => a.invoiceNumber - b.invoiceNumber);

  // Prepare rows: header + data
  // Header without Created At per new requirement
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
  const data: (string | number)[][] = [header];
  for (const inv of invoices) {
    const vat = (inv.amount * (inv.tvaRate || 0)) / 100;
    const net = inv.amount - vat;
    data.push([
      inv.invoiceNumber,
      inv.year,
      inv.month,
      inv.quarter,
      inv.clientName,
      inv.amount,
      inv.tvaRate,
      vat,
      net,
    ]);
  }

  const wb = XLSX.utils!.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Header styling (bold, accent background, dark text)
  for (let c = 0; c < header.length; c++) {
    const cellAddr = XLSX.utils!.encode_cell({ r: 0, c });
    const cell = ws[cellAddr] as Record<string, unknown> | undefined;
    if (cell) {
      (cell as Record<string, unknown>)['s'] = {
        font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: '519D09' } }, // green background
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '3F7A07' } },
          bottom: { style: 'thin', color: { rgb: '3F7A07' } },
        },
      } as unknown as { [k: string]: unknown }; // styled header
    }
  }

  // Number formatting for amount/vat/net columns
  for (let r = 1; r < data.length; r++) {
    const amtCell = ws[XLSX.utils!.encode_cell({ r, c: 5 })];
    const rateCell = ws[XLSX.utils!.encode_cell({ r, c: 6 })];
    const vatCell = ws[XLSX.utils!.encode_cell({ r, c: 7 })];
    const netCell = ws[XLSX.utils!.encode_cell({ r, c: 8 })];
    if (amtCell) (amtCell as Record<string, unknown>)['z'] = '#,##0.00';
    if (rateCell) (rateCell as Record<string, unknown>)['z'] = '0.00';
    if (vatCell) (vatCell as Record<string, unknown>)['z'] = '#,##0.00';
    if (netCell) (netCell as Record<string, unknown>)['z'] = '#,##0.00';
  }

  // Freeze header row & add autofilter
  const ref = ws['!ref'] as string | undefined;
  if (ref) {
    const range = XLSX.utils!.decode_range(ref);
    (ws as Record<string, unknown>)['!autofilter'] = { ref: XLSX.utils!.encode_range(range) };
    (ws as Record<string, unknown>)['!freeze'] = { ySplit: 1 };
  }

  // Column widths based on longest cell content
  const colCount = header.length;
  const widths = new Array(colCount).fill(10).map((_, i) => {
    const maxLen = Math.max(...data.map(r => (r[i] !== undefined ? String(r[i]).length : 0)));
    return { wch: Math.min(Math.max(maxLen + 2, 10), 42) };
  });
  (ws as Record<string, unknown>)['!cols'] = widths as unknown;

  XLSX.utils!.book_append_sheet(wb, ws, 'Invoices');
  const fileName = opts?.fileName || `invoices-all${opts?.year ? '-' + opts.year : ''}.xlsx`;
  const buf = XLSX.write!(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(buf, fileName);
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
