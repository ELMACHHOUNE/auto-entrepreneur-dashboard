import { useEffect, useMemo, useRef, useState } from 'react';

export default function AnimatedNumber({
  value,
  duration = 1200,
  locale = 'en-US',
  maximumFractionDigits = 0,
  className,
}: {
  value: number;
  duration?: number;
  locale?: string;
  maximumFractionDigits?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(0);
  const toRef = useRef<number>(value);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    // Cancel any pending animation
    if (raf.current) cancelAnimationFrame(raf.current);

    fromRef.current = 0; // always animate from 0 as requested
    toRef.current = Number.isFinite(value) ? value : 0;
    startRef.current = performance.now();

    if (prefersReducedMotion || duration <= 0) {
      setDisplay(toRef.current);
      return;
    }

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const current = fromRef.current + (toRef.current - fromRef.current) * eased;
      setDisplay(current);
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, [value, duration, prefersReducedMotion]);

  const formatted = useMemo(() => {
    const nf = new Intl.NumberFormat(locale, { maximumFractionDigits });
    // Avoid showing decimals when unnecessary
    return nf.format(Math.round(display));
  }, [display, locale, maximumFractionDigits]);

  return <span className={className}>{formatted}</span>;
}
