// Heavy libraries are loaded dynamically on demand to reduce initial bundle size

// Load pdfmake at runtime from CDN to avoid bundling a >2MB chunk
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.crossOrigin = 'anonymous';
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
    // Prefer local copy if present (add to public/vendor/pdfmake to enable offline-first)
    '/vendor/pdfmake/pdfmake.min.js',
    // Reliable CDNs
    'https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/pdfmake.min.js',
    'https://unpkg.com/pdfmake@0.2.20/build/pdfmake.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.20/pdfmake.min.js',
  ];
  const vfsUrls = [
    '/vendor/pdfmake/vfs_fonts.min.js',
    'https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/vfs_fonts.min.js',
    'https://unpkg.com/pdfmake@0.2.20/build/vfs_fonts.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.20/vfs_fonts.min.js',
  ];
  await loadFirstAvailable(
    pdfmakeUrls,
    () => !!(window as unknown as { pdfMake?: PdfMakeGlobal }).pdfMake
  );
  await loadFirstAvailable(
    vfsUrls,
    () => !!(window as unknown as { pdfMake?: PdfMakeGlobal }).pdfMake?.vfs
  );
  if (!w.pdfMake?.createPdf) throw new Error('pdfMake not available after loading scripts');
  return w.pdfMake;
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

  const xml = new XMLSerializer().serializeToString(clone);

  // Render with canvg to respect computed styles without html2canvas
  const canvg = await Canvg.fromString(ctx, xml, {
    ignoreMouse: true,
    ignoreAnimation: true,
  });
  await canvg.render();
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
