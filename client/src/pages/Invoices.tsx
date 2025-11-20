import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, Image as ImageIcon, UploadCloud, Trash2 } from 'lucide-react';
import {
  FileUploader,
  FileInput,
  FileUploaderContent,
  FileUploaderItem,
} from '@/components/ui/file-upload';
import RequireAuth from '@/components/RequireAuth';

interface StoredFileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  previewDataUrl?: string; // thumbnail/preview (images only currently)
  dataUrl?: string; // full data URL for download / inline view
  textContent?: string; // optional textual content for plain text / csv / json
}

// Local storage key for persistence (client-side only for now)
const LS_KEY = 'uploadedUserFiles';

function loadStored(): StoredFileMeta[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as StoredFileMeta[];
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

  // Derived total size
  const totalSize = useMemo(() => storedFiles.reduce((s, f) => s + f.size, 0), [storedFiles]);

  const removeStored = useCallback((id: string) => {
    setStoredFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      saveStored(next);
      return next;
    });
  }, []);

  const onImport = useCallback(async () => {
    if (!selectedFiles?.length) return;
    setImporting(true);
    try {
      const metas: StoredFileMeta[] = [];
      for (const f of selectedFiles) {
        // Always read data URL for download
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(f);
        });
        const previewDataUrl: string | undefined = f.type.startsWith('image/')
          ? dataUrl
          : undefined;
        let textContent: string | undefined;
        if (
          /^(text\/|application\/json|application\/csv)/.test(f.type) ||
          /\.(csv|txt|json)$/i.test(f.name)
        ) {
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
          previewDataUrl,
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
  }, [selectedFiles]);

  // Placeholder for future server sync (e.g., Neon). Runs once.
  useEffect(() => {
    // TODO: fetch remote file list when backend is ready
  }, []);

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Invoices Files</h2>
            <p className="text-sm text-muted-foreground">
              Upload and manage raw invoice/import files.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="rounded-md border px-3 py-2">
              <div className="text-muted-foreground">Stored files</div>
              <div className="tabular-nums font-semibold">{storedFiles.length}</div>
            </div>
            <div className="rounded-md border px-3 py-2">
              <div className="text-muted-foreground">Total size</div>
              <div className="tabular-nums font-semibold">{(totalSize / 1024).toFixed(1)} KB</div>
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
              dropzoneOptions={{ multiple: true, maxFiles: 12 }}
              className="gap-3"
            >
              <FileInput className="text-center text-sm">
                <div className="flex flex-col items-center gap-2">
                  <UploadCloud size={24} />
                  <p className="font-medium">Click or drag files here</p>
                  <p className="text-xs text-muted-foreground">Images, CSV, Excel, PDF… (max 12)</p>
                </div>
              </FileInput>
              <FileUploaderContent>
                {selectedFiles?.map((f, i) => (
                  <FileUploaderItem key={i} index={i} className="overflow-hidden border p-2">
                    <div className="flex items-center gap-2 text-xs">
                      {f.type.startsWith('image/') ? (
                        <ImageIcon size={14} />
                      ) : f.type.includes('sheet') || /excel/i.test(f.name) ? (
                        <FileSpreadsheet size={14} />
                      ) : f.type.includes('pdf') ? (
                        <FileText size={14} />
                      ) : (
                        <FileText size={14} />
                      )}
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
                  {activeFile.dataUrl && (
                    <a
                      href={activeFile.dataUrl}
                      download={activeFile.name}
                      className="rounded-md border px-3 py-1 text-xs font-medium"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
              <div className="rounded-md border bg-card/50 p-3">
                {activeFile.type.startsWith('image/') && activeFile.dataUrl ? (
                  <img
                    src={activeFile.dataUrl}
                    alt={activeFile.name}
                    className="max-h-[480px] w-auto rounded-md"
                  />
                ) : activeFile.type === 'application/pdf' && activeFile.dataUrl ? (
                  <iframe
                    src={activeFile.dataUrl}
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
                      {f.type.startsWith('image/') ? (
                        <ImageIcon size={16} />
                      ) : f.type.includes('sheet') || /excel/i.test(f.name) ? (
                        <FileSpreadsheet size={16} />
                      ) : f.type.includes('pdf') ? (
                        <FileText size={16} />
                      ) : (
                        <FileText size={16} />
                      )}
                      <span className="truncate font-medium" title={f.name}>
                        {f.name}
                      </span>
                    </div>
                    {f.previewDataUrl && (
                      <img
                        src={f.previewDataUrl}
                        alt={f.name}
                        className="mb-2 h-24 w-full rounded-md object-cover"
                        loading="lazy"
                      />
                    )}
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
                        {f.dataUrl && (
                          <a
                            href={f.dataUrl}
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
      </div>
    </RequireAuth>
  );
}
