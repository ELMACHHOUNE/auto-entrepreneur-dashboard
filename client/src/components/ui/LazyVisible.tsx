import React, { useEffect, useRef, useState } from 'react';

type LazyVisibleProps = {
  children: React.ReactNode;
  /** Optional skeleton or placeholder while content isn't mounted yet */
  fallback?: React.ReactNode;
  /** Reserve height to avoid layout shift (e.g., '20rem' or a class on wrapper) */
  minHeight?: string | number;
  /** IntersectionObserver rootMargin (e.g., '200px') to mount slightly before visible */
  rootMargin?: string;
  /** Threshold for intersection observer (0..1). Defaults to 0 */
  threshold?: number | number[];
  /** If true, keeps content mounted after first view. Default true. */
  once?: boolean;
  /** Force mount externally. When true, ignores visibility. */
  mounted?: boolean;
  /** Called once to register a force-mount callback, useful to mount before exports. */
  onRegister?: (force: () => void) => void;
};

/**
 * LazyVisible mounts children only when the wrapper scrolls into the viewport.
 * Use onRegister to collect force-mount callbacks (e.g., for PDF exports).
 */
export default function LazyVisible({
  children,
  fallback,
  minHeight,
  rootMargin = '200px',
  threshold = 0,
  once = true,
  mounted,
  onRegister,
}: LazyVisibleProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [forced, setForced] = useState(false);

  // Force callback for external triggers (e.g., before PDF export)
  useEffect(() => {
    if (!onRegister) return;
    const force = () => setForced(true);
    onRegister(force);
    // No cleanup necessary; caller manages its registry lifecycle per page instance
  }, [onRegister]);

  useEffect(() => {
    if (mounted || forced) return; // externally forced or controlled
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      // No IO support: mount immediately
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            setVisible(true);
            if (once) observer.disconnect();
            break;
          }
        }
      },
      { root: null, rootMargin, threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold, mounted, forced]);

  const shouldMount = Boolean(mounted || forced || visible);

  return (
    <div ref={containerRef} style={minHeight ? { minHeight } : undefined} aria-busy={!shouldMount}>
      {shouldMount ? children : fallback ?? null}
    </div>
  );
}
