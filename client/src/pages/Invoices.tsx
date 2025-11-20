import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, UploadCloud, Trash2, Crown, HardDrive, Gauge } from 'lucide-react';
import {
  FileUploader,
  FileInput,
  FileUploaderContent,
  FileUploaderItem,
} from '@/components/ui/file-upload';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface StoredFileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  previewDataUrl?: string; // kept for potential future use
  dataUrl?: string;
  textContent?: string;
}

// Local storage key for persistence (client-side only for now)
const LS_KEY = 'uploadedUserFiles';

// Strictly validate that a data URL is one of the allowed mime types (PDF / Word) and base64 encoded.
function sanitizeDataUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  // Only allow data URLs for the supported file types, base64 encoded.
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const match = url.match(/^data:([a-zA-Z0-9_./-]+);base64,[A-Za-z0-9+/=]+$/);
  if (!match) return undefined;
  const mime = match[1];
  if (!allowedMimes.includes(mime)) return undefined;
  return url;
}

function loadStored(): StoredFileMeta[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Sanitize each entry defensively in case localStorage was tampered with.
      return parsed
        .map(p => {
          const safe: StoredFileMeta = {
            id: typeof p.id === 'string' ? p.id : crypto.randomUUID(),
            name: typeof p.name === 'string' ? p.name : 'unknown',
            size: typeof p.size === 'number' ? p.size : 0,
            type: typeof p.type === 'string' ? p.type : 'application/octet-stream',
            lastModified: typeof p.lastModified === 'number' ? p.lastModified : Date.now(),
            previewDataUrl: undefined, // not used currently
            dataUrl: sanitizeDataUrl(p.dataUrl),
            textContent: typeof p.textContent === 'string' ? p.textContent : undefined,
          };
          return safe;
        })
        .filter(f => !!f.id && typeof f.name === 'string');
    }
  } catch (e) {
    console.warn('Failed to parse stored files', e);
  }
  return [];
}
function saveStored(files: StoredFileMeta[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(files));
  } catch (e) {
    console.warn('Failed to persist stored files', e);
  }
}

export default function Invoices() {
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);
  const [storedFiles, setStoredFiles] = useState<StoredFileMeta[]>(() => loadStored());
  const [importing, setImporting] = useState(false);
  const [activeFile, setActiveFile] = useState<StoredFileMeta | null>(null);
  const { user } = useAuth();
  const plan: 'freemium' | 'premium' = user?.plan === 'premium' ? 'premium' : 'freemium';
  const PLAN_LIMIT_BYTES = plan === 'premium' ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
  const usageBytes = useMemo(() => storedFiles.reduce((sum, f) => sum + f.size, 0), [storedFiles]);
  const usagePercent = Math.min(100, (usageBytes / PLAN_LIMIT_BYTES) * 100);
  const remainingBytes = PLAN_LIMIT_BYTES - usageBytes;
  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  const removeStored = useCallback((id: string) => {
    setStoredFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      saveStored(next);
      return next;
    });
  }, []);

  const onImport = useCallback(async () => {
    if (!selectedFiles?.length) return;
    const incomingBytes = selectedFiles.reduce((s, f) => s + f.size, 0);
    if (usageBytes + incomingBytes > PLAN_LIMIT_BYTES) {
      alert(
        `Storage limit exceeded. Attempting ${formatBytes(
          usageBytes + incomingBytes
        )} of ${formatBytes(PLAN_LIMIT_BYTES)}. Remove files or upgrade your plan.`
      );
      return;
    }
    setImporting(true);
    try {
      const metas: StoredFileMeta[] = [];
      for (const f of selectedFiles) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(f);
        });
        let textContent: string | undefined;
        if (/\.(csv|txt|json)$/i.test(f.name)) {
          textContent = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(f);
          });
        }
        metas.push({
          id: `${f.name}-${f.lastModified}-${Math.random().toString(36).slice(2)}`,
          name: f.name,
          size: f.size,
          type: f.type || 'application/octet-stream',
          lastModified: f.lastModified,
          dataUrl,
          textContent,
        });
      }
      setStoredFiles(prev => {
        const next = [...prev, ...metas].sort((a, b) => a.name.localeCompare(b.name));
        saveStored(next);
        return next;
      });
      setSelectedFiles(null);
    } catch (e) {
      console.warn('Failed to import files', e);
    } finally {
      setImporting(false);
    }
  }, [selectedFiles, PLAN_LIMIT_BYTES, usageBytes]);

  // Placeholder for future server sync (e.g., Neon). Runs once.
  useEffect(() => {
    // TODO: fetch remote file list when backend is ready
  }, []);

  return (
    <RequireAuth>
      <DashboardLayout>
        {/* ...existing invoices content... */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Invoices Files</h2>
              <p className="text-sm text-muted-foreground">
                Upload and manage your invoice documents (PDF / Word). Storage limited by
                subscription plan.
              </p>
            </div>
            {plan === 'freemium' && (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-linear-to-r from-accent/10 to-transparent">
                <Crown size={16} className="text-accent" />
                <p className="text-xs leading-tight">
                  Upgrade to <span className="font-semibold">Premium</span> for 10× more storage.
                </p>
              </div>
            )}
          </div>
          <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Crown
                    size={18}
                    className={plan === 'premium' ? 'text-yellow-500' : 'text-muted-foreground'}
                  />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Plan
                  </span>
                </div>
                <div className="text-sm font-semibold">
                  {plan === 'premium' ? 'Premium' : 'Freemium'}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({formatBytes(PLAN_LIMIT_BYTES)})
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <HardDrive size={18} className="text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Storage used
                  </span>
                </div>
                <div className="text-sm font-semibold tabular-nums flex items-center gap-2">
                  {formatBytes(usageBytes)}
                  <span className="text-muted-foreground font-normal">
                    / {formatBytes(PLAN_LIMIT_BYTES)}
                  </span>
                </div>
                <div
                  className="relative mt-1 h-2 w-full overflow-hidden rounded bg-muted"
                  role="progressbar"
                  aria-valuenow={Math.round(usagePercent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Storage usage"
                >
                  <div
                    className={`h-full transition-all ${
                      usagePercent > 85
                        ? 'bg-red-500'
                        : usagePercent > 60
                        ? 'bg-yellow-500'
                        : 'bg-accent'
                    }`}
                    style={{ width: usagePercent + '%' }}
                  />
                </div>
                {remainingBytes < PLAN_LIMIT_BYTES * 0.1 && (
                  <div className="text-[11px] text-warning">
                    Only {formatBytes(remainingBytes)} remaining.
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Gauge size={18} className="text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Files stored
                  </span>
                </div>
                <div className="text-sm font-semibold tabular-nums">{storedFiles.length}</div>
                <p className="text-[11px] text-muted-foreground">
                  {usagePercent.toFixed(1)}% of capacity used.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload & list layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Upload section */}
          <div className="rounded-lg border bg-card p-4 shadow-sm lg:col-span-1">
            <h3 className="mb-3 text-base font-semibold">Import files</h3>
            <FileUploader
              value={selectedFiles}
              onValueChange={setSelectedFiles}
              dropzoneOptions={{
                multiple: true,
                maxFiles: 12,
                accept: {
                  'application/pdf': ['.pdf'],
                  'application/msword': ['.doc'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
                    '.docx',
                  ],
                },
              }}
              className="gap-3"
            >
              <FileInput className="text-center text-sm">
                <div className="flex flex-col items-center gap-2">
                  <UploadCloud size={24} />
                  <p className="font-medium">Click or drag PDF / Word files</p>
                  <p className="text-xs text-muted-foreground">
                    Accepted: .pdf .doc .docx (max 12)
                  </p>
                </div>
              </FileInput>
              <FileUploaderContent>
                {selectedFiles?.map((f, i) => (
                  <FileUploaderItem key={i} index={i} className="overflow-hidden border p-2">
                    <div className="flex items-center gap-2 text-xs">
                      <FileText size={14} />
                      <span className="truncate max-w-[120px]" title={f.name}>
                        {f.name}
                      </span>
                      <span className="ml-auto tabular-nums">{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </FileUploaderItem>
                ))}
              </FileUploaderContent>
            </FileUploader>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={!selectedFiles?.length || importing}
                onClick={onImport}
                className="inline-flex flex-1 items-center justify-center rounded-md border px-3 py-2 text-sm font-medium"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                  borderColor: 'var(--accent)',
                  opacity: !selectedFiles?.length || importing ? 0.6 : 1,
                }}
              >
                {importing ? 'Importing…' : 'Save files'}
              </button>
              <button
                type="button"
                disabled={!selectedFiles?.length || importing}
                onClick={() => setSelectedFiles(null)}
                className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium"
                style={{
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  borderColor: 'var(--border)',
                  opacity: !selectedFiles?.length || importing ? 0.6 : 1,
                }}
              >
                Clear
              </button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Future improvement: persist files in a Neon/Postgres-backed service. Consider a Docker
              compose setup for local development with a storage adapter & signed URLs.
            </p>
          </div>

          {/* Active file inline viewer */}
          {activeFile && (
            <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm lg:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Viewing: {activeFile.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Type: {activeFile.type || 'unknown'} · Size:{' '}
                    {(activeFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFile(null)}
                    className="rounded-md border px-3 py-1 text-xs font-medium"
                  >
                    Close
                  </button>
                  {activeFile.dataUrl &&
                    (() => {
                      const safeUrl = sanitizeDataUrl(activeFile.dataUrl);
                      if (!safeUrl) return null;
                      return (
                        <a
                          href={safeUrl}
                          download={activeFile.name}
                          className="rounded-md border px-3 py-1 text-xs font-medium"
                        >
                          Download
                        </a>
                      );
                    })()}
                </div>
              </div>
              <div className="rounded-md border bg-card/50 p-3">
                {activeFile.type === 'application/pdf' && sanitizeDataUrl(activeFile.dataUrl) ? (
                  <iframe
                    src={sanitizeDataUrl(activeFile.dataUrl)!}
                    title={activeFile.name}
                    className="h-[480px] w-full rounded-md"
                  />
                ) : activeFile.textContent ? (
                  <pre className="max-h-[480px] overflow-auto text-xs leading-relaxed whitespace-pre-wrap">
                    {activeFile.textContent}
                  </pre>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    No inline preview available for this file type.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stored files list */}
          <div className="rounded-lg border bg-card p-4 shadow-sm lg:col-span-2">
            <h3 className="mb-3 text-base font-semibold">Uploaded files</h3>
            {storedFiles.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No files uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {storedFiles.map(f => (
                  <div
                    key={f.id}
                    className="group relative flex flex-col rounded-md border p-3 text-xs shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} />
                      <span className="truncate font-medium" title={f.name}>
                        {f.name}
                      </span>
                    </div>
                    {/* Image preview removed: only PDF/Word allowed */}
                    <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{(f.size / 1024).toFixed(1)} KB</span>
                      <span>{new Date(f.lastModified).toLocaleDateString()}</span>
                      <div className="flex w-full flex-wrap gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveFile(f)}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 font-medium hover:bg-accent hover:text-accent-foreground"
                        >
                          View
                        </button>
                        {sanitizeDataUrl(f.dataUrl) && (
                          <a
                            href={sanitizeDataUrl(f.dataUrl)!}
                            download={f.name}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 font-medium hover:bg-accent hover:text-accent-foreground"
                          >
                            Download
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => removeStored(f.id)}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 font-medium text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}
