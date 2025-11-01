import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useDropzone, type DropzoneOptions, type DropEvent } from 'react-dropzone';
import { cn } from '@/lib/utils';

type FileUploaderContextValue = {
  files: File[];
  setFiles: (next: File[]) => void;
  options: DropzoneOptions;
  removeAt: (index: number) => void;
};

const FileUploaderContext = createContext<FileUploaderContextValue | null>(null);

function useFileUploaderCtx() {
  const ctx = useContext(FileUploaderContext);
  if (!ctx) throw new Error('FileUploader components must be used within <FileUploader>');
  return ctx;
}

export function FileUploader({
  value,
  onValueChange,
  dropzoneOptions,
  orientation = 'vertical',
  className,
  children,
}: {
  value: File[] | null;
  onValueChange: (files: File[] | null) => void;
  dropzoneOptions?: DropzoneOptions;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  children: React.ReactNode;
}) {
  const files = useMemo(() => value ?? [], [value]);
  const setFiles = useCallback(
    (next: File[]) => {
      onValueChange(next.length ? next : null);
    },
    [onValueChange]
  );

  const opts: DropzoneOptions = {
    multiple: false,
    maxFiles: 1,
    ...dropzoneOptions,
    onDropAccepted: (acceptedFiles, event: DropEvent) => {
      const next = (dropzoneOptions?.multiple ? [...files, ...acceptedFiles] : acceptedFiles).slice(
        0,
        dropzoneOptions?.maxFiles ?? (dropzoneOptions?.multiple ? 4 : 1)
      );
      setFiles(next);
      // Call through for external listeners if provided
      dropzoneOptions?.onDropAccepted?.(acceptedFiles, event);
    },
  };

  const removeAt = useCallback(
    (index: number) => {
      const next = files.filter((_, i) => i !== index);
      setFiles(next);
    },
    [files, setFiles]
  );

  const ctx: FileUploaderContextValue = { files, setFiles, options: opts, removeAt };

  return (
    <FileUploaderContext.Provider value={ctx}>
      <div className={cn('flex', orientation === 'vertical' ? 'flex-col' : 'flex-row', className)}>
        {children}
      </div>
    </FileUploaderContext.Provider>
  );
}

export function FileInput({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { options } = useFileUploaderCtx();
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone(options);
  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative w-full cursor-pointer rounded-lg border border-dashed p-4 transition-colors',
        'outline-2 outline-offset-2 outline-ring/40',
        isDragActive && 'bg-accent/10',
        isDragReject && 'bg-destructive/10',
        className
      )}
    >
      <input {...getInputProps()} />
      {children}
    </div>
  );
}

export function FileUploaderContent({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <div className={cn('mt-2 flex flex-wrap gap-2', className)}>{children}</div>;
}

export function FileUploaderItem({
  index,
  className,
  children,
  showRemove = true,
}: {
  index: number;
  className?: string;
  children?: React.ReactNode;
  showRemove?: boolean;
}) {
  const { removeAt } = useFileUploaderCtx();
  return (
    <div className={cn('relative rounded-md', className)}>
      {children}
      {showRemove && (
        <button
          type="button"
          aria-label="Remove file"
          onClick={() => removeAt(index)}
          className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white text-xs"
        >
          ×
        </button>
      )}
    </div>
  );
}

export type { DropzoneOptions };
