import path from 'path';

/**
 * Resolve a child path under a base directory, ensuring the result stays within the base.
 * Throws if the resolved path escapes the baseDir.
 */
export function pathWithin(baseDir: string, child: string): string {
  // For our usage, enforce a conservative filename policy
  const safeChild = child.replace(/[^a-zA-Z0-9._-]/g, '_');
  const resolved = path.resolve(baseDir, safeChild);
  const normalizedBase = path.resolve(baseDir);
  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    throw new Error('Invalid path');
  }
  return resolved;
}
