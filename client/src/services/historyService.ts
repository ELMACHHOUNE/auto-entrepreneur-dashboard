// historyService.ts
// Service wrapper around the absolute URL history patch to keep side-effects isolated.
// Provides install, status check, and optional uninstall (best-effort).

import { installAbsoluteUrlHistoryPatch } from '@/lib/history-absolute-url-patch';

/** Identifier stored on window to mark patch status */
const FLAG: keyof Window = '__ABS_URL_HISTORY_PATCHED__';

/** Returns true if the patch has already been applied */
export function isHistoryPatched(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window[FLAG]);
}

/** Safely installs the patch if not already applied */
export function ensureAbsoluteHistory(): void {
  if (typeof window === 'undefined') return;
  if (isHistoryPatched()) return;
  installAbsoluteUrlHistoryPatch();
}

/** OPTIONAL: Attempt to revert the patch (non-critical; for tests/hot-reload). */
export function uninstallAbsoluteHistoryPatch(): void {
  if (typeof window === 'undefined') return;
  if (!isHistoryPatched()) return;
  try {
    // We cannot restore original functions unless we had stored them.
    // Future improvement: capture originals before patch and restore them here.
    delete window[FLAG];
  } catch {
    // noop
  }
}

/** Convenience bootstrap for dev environments */
export function initHistoryService(): void {
  if (import.meta.env.DEV) {
    ensureAbsoluteHistory();
  }
}

export default {
  init: initHistoryService,
  ensure: ensureAbsoluteHistory,
  uninstall: uninstallAbsoluteHistoryPatch,
  isPatched: isHistoryPatched,
};
