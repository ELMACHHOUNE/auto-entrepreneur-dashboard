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

// Minimal ExcelJS typings used by both invoices and charts exports
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
  } & MinimalCell;
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

// --- SVG rasterization helpers (lightweight copies tailored for Excel export) ---
function resolveColorTokenExcel(token: string, scopeEl: Element): string | undefined {
  const direct = token.trim();
  if (/^(#|rgb\(|rgba\(|hsl\(|hsla\()/i.test(direct)) return direct;
  const varMatch = direct.match(/var\((--[\w-]+)\)/);
  if (varMatch) {
    const probe = document.createElement('span');
    probe.style.color = `var(${varMatch[1]})`;
    scopeEl.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    if (resolved && resolved !== 'rgba(0, 0, 0, 0)' && resolved !== 'inherit') return resolved;
  }
  return undefined;
}

function inlineSvgCssVarsExcel(svgEl: SVGSVGElement, scopeEl: Element): SVGSVGElement {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
  const attrsToCheck = ['fill', 'stroke', 'stop-color', 'color'];
  while (walker.nextNode()) {
    const el = walker.currentNode as Element;
    const styleAttr = el.getAttribute('style');
    if (styleAttr && styleAttr.includes('var(')) {
      const varRegex = /var\((--[\w-]+)\)/g;
      const newStyle = styleAttr.replace(varRegex, (_, name) => {
        return resolveColorTokenExcel(`var(${name})`, scopeEl) || _;
      });
      el.setAttribute('style', newStyle);
    }
    for (const attr of attrsToCheck) {
      const val = el.getAttribute(attr);
      if (val && val.includes('var(')) {
        const resolved = resolveColorTokenExcel(val, scopeEl);
        if (resolved) el.setAttribute(attr, resolved);
      }
    }
  }
  return clone;
}

async function svgToPngDataUrlExcel(svgEl: SVGSVGElement, scale = 2, scopeEl?: Element) {
  const { Canvg } = await import('canvg');
  const rect = svgEl.getBoundingClientRect();
  const width = Math.max(
    1,
    Math.floor((rect.width || parseFloat(svgEl.getAttribute('width') || '0') || 600) * scale)
  );
  const height = Math.max(
    1,
    Math.floor((rect.height || parseFloat(svgEl.getAttribute('height') || '0') || 400) * scale)
  );
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');
  const clone = inlineSvgCssVarsExcel(svgEl, scopeEl || svgEl);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  const xml = new XMLSerializer().serializeToString(clone);
  const canvg = await Canvg.fromString(ctx, xml, { ignoreMouse: true, ignoreAnimation: true });
  try {
    const bg = resolveColorTokenExcel('var(--card)', scopeEl || svgEl) || '#ffffff';
    ctx.save();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } catch {
    /* no background fill override available */
  }
  await canvg.render();
  return canvas.toDataURL('image/png');
}

// Export up to 5 charts from a container into a single Excel worksheet
export async function exportChartsExcelFromElement(
  rootEl: HTMLElement,
  meta?: { title?: string; year?: number; chartTitles?: string[]; fileName?: string }
) {
  // Create a temporary light-theme scope so charts resolve CSS vars to light colors
  const lightScope = document.createElement('div');
  lightScope.style.position = 'absolute';
  lightScope.style.left = '-99999px';
  lightScope.style.top = '0';
  const lightVars: Record<string, string> = {
    '--card': '#ffffff',
    '--foreground': '#050315',
    '--muted': '#f3f4f6',
    '--muted-foreground': '#4b5563',
    '--border': '#e5e7eb',
    '--input': '#e5e7eb',
    '--ring': '#0776c0',
    '--primary': '#0776c0',
    '--accent': '#fdc401',
    '--success': '#519d09',
    '--destructive': '#d11c0a',
  };
  for (const [k, v] of Object.entries(lightVars)) lightScope.style.setProperty(k, v);
  document.body.appendChild(lightScope);

  const all = Array.from(rootEl.querySelectorAll('svg.recharts-surface')) as SVGSVGElement[];
  const charts: SVGSVGElement[] = [];
  for (const s of all) {
    try {
      const b = s.getBBox();
      if (b.width >= 100 && b.height >= 80) charts.push(s);
    } catch {
      charts.push(s);
    }
    if (charts.length >= 5) break;
  }

  const images: string[] = [];
  const captions: string[] = [];
  const inferTitle = (svg: SVGSVGElement, index: number): string => {
    const direct = svg.getAttribute('aria-label') || svg.querySelector('title')?.textContent || '';
    if (direct) return direct.trim();
    let ancestor: HTMLElement | null = svg.parentElement as HTMLElement | null;
    for (let depth = 0; depth < 8 && ancestor; depth++) {
      const heading = ancestor.querySelector('h1,h2,h3,h4,[data-title]') as HTMLElement | null;
      if (heading?.textContent) return heading.textContent.trim();
      let sib: Element | null = ancestor.previousElementSibling;
      for (let i = 0; i < 3 && sib; i++) {
        const hs = (sib as HTMLElement).querySelector?.(
          'h1,h2,h3,h4,[data-title]'
        ) as HTMLElement | null;
        if (hs?.textContent) return hs.textContent.trim();
        if ((sib as HTMLElement).matches?.('h1,h2,h3,h4,[data-title]')) {
          return ((sib as HTMLElement).textContent || '').trim();
        }
        sib = sib.previousElementSibling;
      }
      ancestor = ancestor.parentElement as HTMLElement | null;
    }
    return `Chart ${index + 1}`;
  };

  for (let i = 0; i < charts.length; i++) {
    const svg = charts[i];
    try {
      const url = await svgToPngDataUrlExcel(svg, 2.2, lightScope);
      images.push(url);
      const explicit = meta?.chartTitles?.[i];
      captions.push((explicit && explicit.trim()) || inferTitle(svg, i));
    } catch (e) {
      console.warn('Chart convert failed', e);
    }
  }
  lightScope.remove();

  if (!images.length) {
    console.warn('No charts found to export');
    return;
  }

  // Build Excel workbook with a single sheet laying out all charts vertically
  const excelJsMod = await import('exceljs');
  const excelNs = excelJsMod as unknown as ExcelWorkbookNamespace;
  const ExcelNS = excelNs.Workbook ? excelNs : excelNs.default || excelNs;
  if (!ExcelNS.Workbook) {
    console.error('ExcelJS module did not expose Workbook');
    return;
  }
  const wb = new ExcelNS.Workbook();
  const ws = wb.addWorksheet('Dashboard charts');
  // Set consistent column widths
  const totalCols = 11;
  for (let c = 1; c <= totalCols; c++) ws.getColumn(c).width = 12;

  let rowCursor = 1; // 1-based for getRow(); image anchors use 0-based

  // Optional overall title at the top
  const overallTitle = meta?.title || `Dashboard charts${meta?.year ? ' (' + meta.year + ')' : ''}`;
  if (overallTitle) {
    ws.addRow([overallTitle]);
    const r = ws.getRow(rowCursor);
    r.font = { bold: true, size: 14, color: { argb: 'FF050315' } } as unknown as Record<
      string,
      unknown
    >;
    r.alignment = { horizontal: 'center', vertical: 'middle' } as unknown as Record<
      string,
      unknown
    >;
    r.height = 24;
    // Merge A1:K1 for nice centered title
    (ws as unknown as { mergeCells?: (...args: unknown[]) => void }).mergeCells?.(
      rowCursor,
      1,
      rowCursor,
      totalCols
    );
    rowCursor++;
    // spacer
    ws.addRow(['']);
    ws.getRow(rowCursor).height = 8;
    rowCursor++;
  }

  images.forEach((dataUrl, idx) => {
    const sectionTitle = captions[idx] || `Chart ${idx + 1}`;
    // Section title row
    ws.addRow([sectionTitle]);
    const titleRow = ws.getRow(rowCursor);
    titleRow.font = { bold: true, size: 12, color: { argb: 'FF050315' } } as unknown as Record<
      string,
      unknown
    >;
    titleRow.alignment = { horizontal: 'left', vertical: 'middle' } as unknown as Record<
      string,
      unknown
    >;
    titleRow.height = 20;
    // Light gray fill and bottom border
    titleRow.eachCell((cell: { fill?: unknown; border?: unknown }) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
    });
    // Merge title across columns A..K
    (ws as unknown as { mergeCells?: (...args: unknown[]) => void }).mergeCells?.(
      rowCursor,
      1,
      rowCursor,
      totalCols
    );
    rowCursor++;

    // Small spacer between title and image
    ws.addRow(['']);
    ws.getRow(rowCursor).height = 6;
    rowCursor++;

    // Add image filling area A{rowCursor}:K{rowCursor+26} (approx)
    const imageId = (
      wb as unknown as { addImage: (opts: { base64: string; extension: string }) => number }
    ).addImage({ base64: dataUrl, extension: 'png' });
    const wsAny = ws as unknown as {
      addImage: (
        imageId: number,
        range: string | { tl: { col: number; row: number }; br: { col: number; row: number } }
      ) => void;
    };
    const tlRowZero = rowCursor - 1; // convert to 0-based
    wsAny.addImage(imageId, {
      tl: { col: 0, row: tlRowZero },
      br: { col: 10, row: tlRowZero + 26 },
    });

    // Set some row heights for the image block
    for (let r = rowCursor; r <= rowCursor + 26; r++) {
      ws.getRow(r).height = 18;
    }
    rowCursor += 27;

    // Spacer after each section
    ws.addRow(['']);
    ws.getRow(rowCursor).height = 10;
    rowCursor++;
  });

  const fileName = meta?.fileName || `dashboard-charts${meta?.year ? '-' + meta.year : ''}.xlsx`;
  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(buf as ArrayBuffer, fileName);
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
