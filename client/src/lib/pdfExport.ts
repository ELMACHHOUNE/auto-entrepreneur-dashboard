// Heavy libraries are loaded dynamically on demand to reduce initial bundle size

// Load pdfmake at runtime from CDN to avoid bundling a >2MB chunk
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    // Do not set crossOrigin explicitly to avoid CORS noise on some CDNs/404s
    let settled = false;
    const done = (ok: boolean, err?: string) => {
      if (settled) return;
      settled = true;
      s.onload = null;
      s.onerror = null;
      clearTimeout(timer);
      if (ok) resolve();
      else reject(new Error(err || `Failed to load script: ${src}`));
    };
    s.onload = () => {
      // onload can fire even on 404 with HTML mime on some setups.
      // Defer resolution to caller's check function, so just resolve here.
      done(true);
    };
    s.onerror = () => done(false);
    const timer = setTimeout(() => done(false, `Timed out loading script: ${src}`), 10000);
    document.head.appendChild(s);
  });
}

async function loadFirstAvailable(urls: string[], verify: () => boolean): Promise<void> {
  const errors: string[] = [];
  for (const url of urls) {
    try {
      await loadScript(url);
      // Verify presence after load (guards against 404 HTML responses)
      if (verify()) return;
      errors.push(`Loaded ${url} but verification failed`);
    } catch (e) {
      errors.push((e as Error).message);
    }
  }
  throw new Error(`All script sources failed. Errors: ${errors.join(' | ')}`);
}

type PdfMakeGlobal = {
  vfs?: unknown;
  fonts?: unknown;
  createPdf: (doc: unknown) => { download: (name: string) => void };
};

async function ensurePdfMake(): Promise<PdfMakeGlobal> {
  const w = window as unknown as { pdfMake?: PdfMakeGlobal };
  if (w.pdfMake?.createPdf) return w.pdfMake;
  // Load core and default fonts (Roboto) from CDN with multi-source fallback
  const pdfmakeUrls = [
    'https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/pdfmake.min.js',
    'https://unpkg.com/pdfmake@0.2.20/build/pdfmake.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.20/pdfmake.min.js',
  ];
  const vfsUrls = [
    'https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/vfs_fonts.js',
    'https://unpkg.com/pdfmake@0.2.20/build/vfs_fonts.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.20/vfs_fonts.js',
  ];
  try {
    await loadFirstAvailable(
      pdfmakeUrls,
      () => !!(window as unknown as { pdfMake?: PdfMakeGlobal }).pdfMake
    );
  } catch (coreErr) {
    throw new Error('Failed to load pdfmake core scripts: ' + (coreErr as Error).message);
  }
  // Load fonts sequentially without verification to reduce console noise.
  if (!w.pdfMake?.vfs) {
    for (const url of vfsUrls) {
      try {
        await loadScript(url);
        if (w.pdfMake?.vfs) break;
      } catch {
        /* ignore */
      }
    }
  }
  // Fallback fetch+eval if still missing
  if (!w.pdfMake?.vfs) {
    // Final fallback: attempt loading the first font URL via script tag (no eval of fetched code)
    try {
      await loadScript(vfsUrls[0]);
    } catch {
      // ignore; warning below will indicate missing fonts
    }
  }
  if (!w.pdfMake?.createPdf) throw new Error('pdfMake not available after loading scripts');
  if (!w.pdfMake?.vfs) {
    console.warn('pdfMake fonts (vfs) missing; proceeding may result in missing glyphs.');
  }
  return w.pdfMake;
}

// Normalize spaces produced by Intl (NBSP U+00A0 or NNBSP U+202F) to regular spaces
// to avoid missing glyphs in embedded PDF fonts.
function normalizePdfSpaces(text: string): string {
  return text.replace(/[\u00A0\u202F]/g, ' ');
}

function resolveColorToken(token: string, scopeEl: Element): string | undefined {
  // If token already looks like a color, return as-is
  const direct = token.trim();
  if (/^(#|rgb\(|rgba\(|hsl\(|hsla\()/i.test(direct)) return direct;
  // Resolve CSS var(...) by leveraging computed styles
  const varMatch = direct.match(/var\((--[\w-]+)\)/);
  if (varMatch) {
    const probe = document.createElement('span');
    probe.style.color = `var(${varMatch[1]})`;
    // Use scopeEl to inherit the right CSS variables (theme)
    scopeEl.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    if (resolved && resolved !== 'rgba(0, 0, 0, 0)' && resolved !== 'inherit') return resolved;
  }
  return undefined;
}

function inlineSvgCssVars(svgEl: SVGSVGElement, scopeEl: Element): SVGSVGElement {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
  const attrsToCheck = ['fill', 'stroke', 'stop-color', 'color'];
  while (walker.nextNode()) {
    const el = walker.currentNode as Element;
    // Inline style="..."
    const styleAttr = el.getAttribute('style');
    if (styleAttr && styleAttr.includes('var(')) {
      let newStyle = styleAttr;
      const varRegex = /var\((--[\w-]+)\)/g;
      newStyle = newStyle.replace(
        varRegex,
        (_, name) => resolveColorToken(`var(${name})`, scopeEl) || _
      );
      el.setAttribute('style', newStyle);
    }
    // Inline specific attributes
    for (const attr of attrsToCheck) {
      const val = el.getAttribute(attr);
      if (val && val.includes('var(')) {
        const resolved = resolveColorToken(val, scopeEl);
        if (resolved) el.setAttribute(attr, resolved);
      }
    }
  }
  return clone;
}

async function svgToPngDataUrl(
  svgEl: SVGSVGElement,
  scale = 2,
  scopeEl?: Element
): Promise<string> {
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

  // Serialize the SVG
  const clone = inlineSvgCssVars(svgEl, scopeEl || svgEl);
  // Ensure explicit size to avoid blurry render
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  // Scrub full-size dark background rects inside the cloned SVG (common in dark theme charts)
  try {
    const rects = Array.from(clone.querySelectorAll('rect')) as SVGRectElement[];
    for (const r of rects) {
      const rw = parseFloat(r.getAttribute('width') || '0');
      const rh = parseFloat(r.getAttribute('height') || '0');
      const rx = parseFloat(r.getAttribute('x') || '0');
      const ry = parseFloat(r.getAttribute('y') || '0');
      if (rw >= width * 0.95 && rh >= height * 0.95 && rx <= 2 && ry <= 2) {
        const fill = (r.getAttribute('fill') || '').trim();
        // Heuristic: treat very dark fills as background we want to force white
        const isHexDark =
          /^#0{1,6}$/.test(fill) || /^#1[0-9a-f]{2,4}$/i.test(fill) || /^#0f0f0f$/i.test(fill);
        const isNamedDark = /(black|#050315|#0a0a0a|rgb\(0, 0, 0\)|rgb\(5, 3, 21\))/i.test(fill);
        if (!fill || isHexDark || isNamedDark) {
          r.setAttribute('fill', '#ffffff');
        }
      }
    }
  } catch {
    // non-fatal; continue
  }

  const xml = new XMLSerializer().serializeToString(clone);

  // Render with canvg to respect computed styles without html2canvas
  const canvg = await Canvg.fromString(ctx, xml, {
    ignoreMouse: true,
    ignoreAnimation: true,
  });
  // Paint a solid background so transparent charts get a light base in PDF
  try {
    const bg = resolveColorToken('var(--card)', scopeEl || svgEl) || '#ffffff';
    ctx.save();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } catch {
    // ignore background paint failures; rendering will proceed
  }
  await canvg.render();
  // If background ended up dark (e.g. original SVG encoded a dark rect), composite onto a fresh white canvas
  const bgPixel = ctx.getImageData(0, 0, 1, 1).data; // sample corner
  const isDark = bgPixel[0] + bgPixel[1] + bgPixel[2] < 96 * 3; // crude luminance check
  if (isDark) {
    const whiteCanvas = document.createElement('canvas');
    whiteCanvas.width = width;
    whiteCanvas.height = height;
    const wctx = whiteCanvas.getContext('2d');
    if (wctx) {
      wctx.fillStyle = '#ffffff';
      wctx.fillRect(0, 0, width, height);
      wctx.drawImage(canvas, 0, 0);
      return whiteCanvas.toDataURL('image/png');
    }
  }
  return canvas.toDataURL('image/png');
}

export async function exportAdminPdfFromElement(
  rootEl: HTMLElement,
  meta?: {
    totalUsers?: number;
    title?: string;
    logoDataUrl?: string;
    yearlyData?: Array<{ name: string; count: number }>;
    catData?: Array<{ name: string; count: number }>;
  }
) {
  // Ensure pdfmake is present (loaded from CDN)
  const pdfMake = await ensurePdfMake();
  // Find only Recharts SVGs for charts, skipping small icons
  const allSvgs = Array.from(rootEl.querySelectorAll('svg.recharts-surface')) as SVGSVGElement[];
  const svgs: SVGSVGElement[] = [];
  for (const s of allSvgs) {
    try {
      const bbox = s.getBBox();
      if (bbox.width >= 100 && bbox.height >= 80) svgs.push(s);
    } catch {
      svgs.push(s);
    }
  }

  // Convert SVGs to images (data URLs)
  const images: string[] = [];
  for (const svg of svgs) {
    try {
      const dataUrl = await svgToPngDataUrl(svg, 2.5, rootEl);
      images.push(dataUrl);
    } catch (e) {
      console.warn('Failed to convert SVG to image for PDF:', e);
    }
  }

  const now = new Date();
  const titleText = meta?.title || 'Admin Dashboard';

  type PdfContent = import('pdfmake/interfaces').Content;
  const content: PdfContent[] = [];

  // Header
  if (meta?.logoDataUrl) {
    content.push({
      image: meta.logoDataUrl,
      width: 56,
      alignment: 'center',
      margin: [0, 0, 0, 6],
    } as unknown as PdfContent);
  }
  content.push({
    text: titleText,
    style: 'title',
    alignment: 'center',
    margin: [0, 0, 0, 2],
  } as unknown as PdfContent);
  content.push({
    text: now.toLocaleString(),
    alignment: 'center',
    color: '#666',
    fontSize: 9,
    margin: [0, 0, 0, 18],
  } as unknown as PdfContent);

  // KPI
  if (typeof meta?.totalUsers === 'number') {
    content.push({
      text: `Total of users is: ${meta.totalUsers.toLocaleString()}`,
      style: 'kpi',
      alignment: 'center',
      margin: [0, 16, 0, 24],
    } as unknown as PdfContent);
  }

  // Big spacer to push charts toward middle
  content.push({ text: ' ', margin: [0, 40, 0, 0] } as unknown as PdfContent);

  // Charts
  if (images.length >= 2) {
    content.push({
      columns: [
        { image: images[0], fit: [250, 170], alignment: 'center' },
        { image: images[1], fit: [250, 170], alignment: 'center' },
      ],
      columnGap: 16,
      margin: [0, 0, 0, 0],
    } as unknown as PdfContent);

    const leftLines = (meta?.yearlyData ?? []).map(d => `${d.name}: ${d.count.toLocaleString()}`);
    const rightLines = (meta?.catData ?? []).map(d => `${d.name}: ${d.count.toLocaleString()}`);
    content.push({
      columns: [
        {
          width: '*',
          stack: [
            { text: 'Numbers of entreprise per year is:', style: 'caption', alignment: 'center' },
            {
              text: leftLines.join('\n'),
              alignment: 'center',
              fontSize: 9,
              color: '#444',
              margin: [0, 4, 0, 0],
            },
          ],
        },
        {
          width: '*',
          stack: [
            {
              text: 'Numbers of entreprise by category is:',
              style: 'caption',
              alignment: 'center',
            },
            {
              text: rightLines.join('\n'),
              alignment: 'center',
              fontSize: 9,
              color: '#444',
              margin: [0, 4, 0, 0],
            },
          ],
        },
      ],
      columnGap: 16,
      margin: [0, 8, 0, 0],
    } as unknown as PdfContent);
  } else if (images.length === 1) {
    content.push({
      image: images[0],
      fit: [520, 260],
      alignment: 'center',
      margin: [0, 0, 0, 0],
    } as unknown as PdfContent);
    const usingYearly = !!(meta?.yearlyData && meta.yearlyData.length);
    const lines = (usingYearly ? meta?.yearlyData ?? [] : meta?.catData ?? []).map(
      d => `${d.name}: ${d.count.toLocaleString()}`
    );
    if (lines.length) {
      const heading = usingYearly
        ? 'Numbers of entreprise per year is:'
        : 'Numbers of entreprise by category is:';
      content.push({
        text: heading,
        style: 'caption',
        alignment: 'center',
        margin: [0, 8, 0, 0],
      } as unknown as PdfContent);
      content.push({
        text: lines.join('\n'),
        alignment: 'center',
        fontSize: 9,
        color: '#444',
        margin: [0, 4, 0, 0],
      } as unknown as PdfContent);
    }
  } else {
    content.push({
      text: 'No charts to include',
      color: '#888',
      alignment: 'center',
      margin: [0, 16, 0, 0],
    } as unknown as PdfContent);
  }

  const docDefinition: import('pdfmake/interfaces').TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [28, 28, 28, 36],
    pageOrientation: 'portrait',
    footer: () => ({
      text: 'by GoToDev',
      alignment: 'center',
      color: '#777777',
      margin: [0, 6, 0, 6],
      fontSize: 9,
    }),
    content,
    styles: {
      title: { fontSize: 18, bold: true },
      kpi: { fontSize: 20, bold: true, color: '#0776c0' },
      caption: { fontSize: 10, bold: true },
    },
    defaultStyle: { fontSize: 10 },
  };

  await new Promise<void>(resolve => {
    pdfMake.createPdf(docDefinition).download('admin-dashboard.pdf');
    resolve();
  });
}

// Compose up to 5 Recharts charts into a single A4 portrait page
export async function exportChartsOnePageFromElement(
  rootEl: HTMLElement,
  meta?: {
    title?: string;
    logoDataUrl?: string;
    year?: number;
    clientsCount?: number;
    totalAmount?: number;
    totalTva?: number;
    chartTitles?: string[];
    labels?: {
      clientsCount?: string; // e.g., "Numbers of clients is: "
      totalPrice?: string; // e.g., "Total price is: "
      totalVat?: string; // e.g., "Total TVA is: "
      noCharts?: string; // e.g., "No charts found"
    };
  }
) {
  const pdfMake = await ensurePdfMake();
  const fmt = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // Build a temporary light-theme scope so charts export in light mode regardless of UI theme
  const lightScope = document.createElement('div');
  lightScope.style.position = 'absolute';
  lightScope.style.left = '-99999px';
  lightScope.style.top = '0';
  // Core light palette (mirrors :root in index.css)
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
  // Resolve card background from light scope
  const cardBg = resolveColorToken('var(--card)', lightScope) || '#ffffff';
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
  // Helper to infer a best-effort chart title from nearby DOM
  const inferTitle = (svg: SVGSVGElement, index: number): string => {
    const direct = svg.getAttribute('aria-label') || svg.querySelector('title')?.textContent || '';
    if (direct) return direct.trim();
    const withAttr =
      svg.closest('[data-chart-title]')?.getAttribute('data-chart-title') ||
      svg.closest('[aria-label]')?.getAttribute('aria-label');
    if (withAttr) return (withAttr || '').trim();
    // Ascend ancestors to find a heading next to the chart card (works with Mantine/Recharts wrappers)
    let ancestor: HTMLElement | null = svg.parentElement as HTMLElement | null;
    for (let depth = 0; depth < 8 && ancestor; depth++) {
      const heading = ancestor.querySelector('h1,h2,h3,h4,[data-title]') as HTMLElement | null;
      if (heading?.textContent) return heading.textContent.trim();
      // check previous siblings for headings
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
      const url = await svgToPngDataUrl(svg, 2.2, lightScope);
      images.push(url);
      const explicit = meta?.chartTitles?.[i];
      captions.push((explicit && explicit.trim()) || inferTitle(svg, i));
    } catch (e) {
      console.warn('Chart convert failed', e);
    }
  }
  // Cleanup the temporary scope
  lightScope.remove();

  const content: import('pdfmake/interfaces').Content[] = [];
  if (meta?.logoDataUrl) {
    content.push({ image: meta.logoDataUrl, width: 48, alignment: 'center', margin: [0, 0, 0, 6] });
  }
  if (meta?.title) {
    content.push({ text: meta.title, style: 'title', alignment: 'center', margin: [0, 0, 0, 8] });
  }

  // Optional KPI block under the title (stack with bold labels)
  const kpiItems: import('pdfmake/interfaces').Content[] = [];
  if (typeof meta?.clientsCount === 'number') {
    kpiItems.push({
      text: [
        { text: meta?.labels?.clientsCount || 'Numbers of clients is: ', bold: true },
        { text: meta.clientsCount.toLocaleString() },
      ],
      fontSize: 10,
      color: '#333',
      alignment: 'center',
    });
  }
  if (typeof meta?.totalAmount === 'number') {
    kpiItems.push({
      text: [
        { text: meta?.labels?.totalPrice || 'Total price is: ', bold: true },
        { text: `${normalizePdfSpaces(fmt.format(meta.totalAmount))} DH` },
      ],
      fontSize: 10,
      color: '#333',
      alignment: 'center',
    });
  }
  if (typeof meta?.totalTva === 'number') {
    kpiItems.push({
      text: [
        { text: meta?.labels?.totalVat || 'Total TVA is: ', bold: true },
        { text: `${normalizePdfSpaces(fmt.format(meta.totalTva))} DH` },
      ],
      fontSize: 10,
      color: '#333',
      alignment: 'center',
    });
  }
  if (kpiItems.length) {
    content.push({
      stack: kpiItems,
      margin: [0, 2, 0, 12],
    } as import('pdfmake/interfaces').Content);
  }

  // Helper to render a chart with a dark/light background and optional caption
  const chartWithBg = (
    img: string,
    fit: [number, number],
    caption?: string
  ): import('pdfmake/interfaces').Content[] => {
    const block: import('pdfmake/interfaces').Content[] = [
      {
        table: {
          widths: ['*'],
          body: [[{ image: img, fit, alignment: 'center', margin: [0, 6, 0, 6] }]],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          fillColor: () => cardBg,
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
        margin: [0, 0, 0, 4],
      },
    ];
    if (caption) {
      block.push({
        text: caption,
        alignment: 'center',
        fontSize: 10,
        color: '#444',
        margin: [0, 2, 0, 10],
      });
    }
    return block;
  };

  // Layout as requested:
  // 1) First row: chart 1 and 2 side by side with captions
  // 2) Then chart 3 with caption
  // 3) Then chart 4 with caption
  // 4) Then chart 5 with caption
  if (images.length === 0) {
    content.push({
      text: meta?.labels?.noCharts || 'No charts found',
      alignment: 'center',
      color: '#777',
    });
  } else {
    // Separator line (horizontal rule) used between chart groups (not after last)
    const separator = (): import('pdfmake/interfaces').Content => ({
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 547, // approximate printable width (A4 width 595 - margins 24*2)
          y2: 0,
          lineWidth: 0.7,
          lineColor: '#e2e8f0',
        },
      ],
      margin: [0, 2, 0, 8],
    });

    // Track remaining charts after each push to decide if a separator is needed
    const hasMoreAfter = (nextIndex: number): boolean => {
      for (let i = nextIndex; i < images.length; i++) if (images[i]) return true;
      return false;
    };

    if (images[0] && images[1]) {
      // two columns with backgrounds
      content.push({
        columns: [
          { stack: chartWithBg(images[0], [240, 160], captions[0]), width: '*' },
          { stack: chartWithBg(images[1], [240, 160], captions[1]), width: '*' },
        ],
        columnGap: 10,
        margin: [0, 0, 0, 6],
      });
      if (hasMoreAfter(2)) content.push(separator());
    } else if (images[0]) {
      content.push(...chartWithBg(images[0], [500, 240], captions[0]));
      if (hasMoreAfter(1)) content.push(separator());
    }
    if (images[2]) {
      content.push(...chartWithBg(images[2], [500, 180], captions[2]));
      if (hasMoreAfter(3)) content.push(separator());
    }
    if (images[3]) {
      content.push(...chartWithBg(images[3], [500, 180], captions[3]));
      if (hasMoreAfter(4)) content.push(separator());
    }
    if (images[4]) {
      content.push(...chartWithBg(images[4], [500, 180], captions[4]));
      // last chart -> no separator
    }
  }

  const doc: import('pdfmake/interfaces').TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [24, 24, 24, 28],
    // Force a white page background irrespective of PDF viewer theme
    background: (_page: number, pageSize: { width: number; height: number }) => ({
      canvas: [
        {
          type: 'rect',
          x: 0,
          y: 0,
          w: pageSize.width,
          h: pageSize.height,
          r: 0,
          color: '#ffffff',
        },
      ],
    }),
    content,
    styles: { title: { fontSize: 16, bold: true } },
    footer: () => ({
      text: 'by GoToDev',
      alignment: 'center',
      fontSize: 9,
      color: '#777',
      margin: [0, 6, 0, 6],
    }),
  };
  pdfMake.createPdf(doc).download('dashboard-charts.pdf');
}

// Export a Mantine React Table (rendered <table>) to pdfmake table
export async function exportDataTablePdfFromElement(
  containerEl: HTMLElement,
  meta?: { title?: string }
) {
  const pdfMake = await ensurePdfMake();
  const table = containerEl.querySelector('table');
  if (!table) {
    console.warn('No table element found for export');
    return;
  }
  const headerCells = Array.from(table.querySelectorAll('thead th')) as HTMLTableCellElement[];
  const rawHeaders = headerCells.map(th => (th.textContent || '').trim());
  // Detect indices of headers to exclude (e.g., Actions column)
  const excludeNames = new Set(['actions', 'action']);
  const includedIndices: number[] = [];
  for (let i = 0; i < rawHeaders.length; i++) {
    const name = rawHeaders[i];
    if (!name) continue; // skip empty header cells entirely
    if (!excludeNames.has(name.toLowerCase())) includedIndices.push(i);
  }
  const headers = includedIndices.map(i => rawHeaders[i]).filter(Boolean);
  const rows = Array.from(table.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
  const bodyRows: string[][] = [];
  for (const tr of rows) {
    const cells = Array.from(tr.querySelectorAll('td')) as HTMLTableCellElement[];
    const vals: string[] = [];
    for (let ci = 0; ci < cells.length; ci++) {
      if (!includedIndices.includes(ci)) continue; // skip excluded columns
      const val = (cells[ci].textContent || '').trim();
      vals.push(val);
    }
    if (vals.some(v => v.length)) bodyRows.push(vals);
  }
  // Sort by Invoice No./Number (ascending) if such a column exists
  const findInvoiceNoIndex = (): number => {
    // Find the absolute column index in all headers
    const targetAbs = rawHeaders.findIndex(h => {
      const t = (h || '').trim().toLowerCase();
      return (
        t === 'invoice no.' ||
        t === 'invoice no' ||
        t === 'invoice #' ||
        t === 'invoice number' ||
        t === 'no.' ||
        t === 'no' ||
        /invoice\s*no/.test(t) ||
        /invoice\s*#/.test(t)
      );
    });
    if (targetAbs < 0) return -1;
    // Map to includedIndices position
    return includedIndices.indexOf(targetAbs);
  };
  const invCol = findInvoiceNoIndex();
  if (invCol >= 0) {
    bodyRows.sort((a, b) => {
      const parseNo = (s: string) => {
        const n = parseInt(s.replace(/[^0-9-]/g, ''), 10);
        return isNaN(n) ? Number.POSITIVE_INFINITY : n;
      };
      return parseNo(a[invCol] || '') - parseNo(b[invCol] || '');
    });
  }
  const tableBody: Array<Array<string | { text: string; bold?: boolean }>> = [];
  if (headers.length) tableBody.push(headers.map(h => ({ text: h, bold: true })));
  for (const r of bodyRows) tableBody.push(r);

  const orientation: 'portrait' | 'landscape' = headers.length > 6 ? 'landscape' : 'portrait';
  const content: import('pdfmake/interfaces').Content[] = [];
  if (meta?.title) content.push({ text: meta.title, style: 'title', margin: [0, 0, 0, 8] });
  content.push({
    table: {
      headerRows: headers.length ? 1 : 0,
      widths: headers.length ? headers.map(() => '*') : undefined,
      body: tableBody,
    },
    layout: 'lightHorizontalLines',
    fontSize: 9,
  });

  const doc: import('pdfmake/interfaces').TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: orientation,
    pageMargins: [18, 24, 18, 28],
    styles: { title: { fontSize: 14, bold: true } },
    defaultStyle: { fontSize: 9 },
    content,
    footer: () => ({
      text: 'by GoToDev',
      alignment: 'center',
      fontSize: 9,
      color: '#777',
      margin: [0, 6, 0, 6],
    }),
  };
  pdfMake.createPdf(doc).download('dashboard-table.pdf');
}

// Export ALL invoices directly from the API (bypasses on-screen pagination/filters)
export async function exportAllInvoicesPdf(opts?: {
  title?: string;
  year?: number;
  fileName?: string;
  locale?: string;
  headers?: string[];
}) {
  const pdfMake = await ensurePdfMake();
  const [{ api }] = await Promise.all([import('@/api/axios')]);
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
  const raw = (res.data?.invoices as RawInvoice[]) || [];
  const rows = [...raw].sort((a, b) => a.invoiceNumber - b.invoiceNumber);

  // Build localized headers if available or use provided override
  let headers = opts?.headers;
  if (!headers) {
    try {
      const i18n = (await import('i18next')).default as unknown as { t: (k: string) => string };
      const t = i18n.t.bind(i18n) as (k: string) => string;
      headers = [
        t('exports.invoicePdf.headers.invoiceNumber'),
        t('exports.invoicePdf.headers.year'),
        t('exports.invoicePdf.headers.month'),
        t('exports.invoicePdf.headers.quarter'),
        t('exports.invoicePdf.headers.client'),
        t('exports.invoicePdf.headers.amountDh'),
        t('exports.invoicePdf.headers.tvaRatePercent'),
        t('exports.invoicePdf.headers.tvaDh'),
        t('exports.invoicePdf.headers.netDh'),
      ];
    } catch {
      headers = [
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
    }
  }
  const body: Array<Array<string | { text: string; bold?: boolean }>> = [];
  body.push(headers.map(h => ({ text: h, bold: true })));
  for (const inv of rows) {
    const vat = (inv.amount * (inv.tvaRate || 0)) / 100;
    const net = inv.amount - vat;
    body.push([
      String(inv.invoiceNumber),
      String(inv.year),
      inv.month || '',
      inv.quarter || '',
      normalizePdfSpaces(inv.clientName || ''),
      `${inv.amount.toLocaleString(opts?.locale || navigator?.language || 'en-US')}`,
      `${(inv.tvaRate || 0).toLocaleString(opts?.locale || navigator?.language || 'en-US')}`,
      `${vat.toLocaleString(opts?.locale || navigator?.language || 'en-US')}`,
      `${net.toLocaleString(opts?.locale || navigator?.language || 'en-US')}`,
    ]);
  }

  const orientation: 'portrait' | 'landscape' = 'landscape';
  const content: import('pdfmake/interfaces').Content[] = [];
  const title = opts?.title || `Invoices table${opts?.year ? ' (' + opts.year + ')' : ''}`;
  content.push({
    text: title,
    style: 'title',
    margin: [0, 0, 0, 8],
  } as unknown as import('pdfmake/interfaces').Content);
  content.push({
    table: {
      headerRows: 1,
      widths: headers.map(() => '*'),
      body,
    },
    layout: 'lightHorizontalLines',
    fontSize: 9,
  } as unknown as import('pdfmake/interfaces').Content);

  const doc: import('pdfmake/interfaces').TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: orientation,
    pageMargins: [18, 24, 18, 28],
    styles: { title: { fontSize: 14, bold: true } },
    defaultStyle: { fontSize: 9 },
    content,
    footer: () => ({
      text: 'by GoToDev',
      alignment: 'center',
      fontSize: 9,
      color: '#777',
      margin: [0, 6, 0, 6],
    }),
  };
  const fileName = opts?.fileName || `invoices-all${opts?.year ? '-' + opts.year : ''}.pdf`;
  pdfMake.createPdf(doc).download(fileName);
}
