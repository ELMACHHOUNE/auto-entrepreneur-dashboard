import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

type Variant = 'success' | 'error' | 'warning' | 'info';

export interface AlertBannerProps {
  open: boolean;
  variant?: Variant;
  title?: string;
  description?: string;
  className?: string;
  autoClose?: number; // ms
  onClose?: () => void;
}

const variantStyles: Record<
  Variant,
  {
    container: string;
    ring: string;
    iconColor: string;
    bar: string;
    role: 'status' | 'alert';
    ariaLive: 'polite' | 'assertive';
  }
> = {
  success: {
    container: 'bg-success/15 text-success-foreground',
    ring: 'ring-success/40',
    iconColor: 'text-success-foreground',
    bar: 'bg-success/50',
    role: 'status',
    ariaLive: 'polite',
  },
  error: {
    container: 'bg-red-500/10 text-red-700 dark:text-red-300',
    ring: 'ring-red-500/30',
    iconColor: 'text-red-600 dark:text-red-400',
    bar: 'bg-red-500/40',
    role: 'alert',
    ariaLive: 'assertive',
  },
  warning: {
    container: 'bg-amber-500/10 text-amber-800 dark:text-amber-200',
    ring: 'ring-amber-500/30',
    iconColor: 'text-amber-600 dark:text-amber-300',
    bar: 'bg-amber-500/40',
    role: 'status',
    ariaLive: 'polite',
  },
  info: {
    container: 'bg-blue-500/10 text-blue-800 dark:text-blue-200',
    ring: 'ring-blue-500/30',
    iconColor: 'text-blue-600 dark:text-blue-300',
    bar: 'bg-blue-500/40',
    role: 'status',
    ariaLive: 'polite',
  },
};

function VariantIcon({ variant }: { variant: Variant }) {
  const common = 'h-4 w-4';
  switch (variant) {
    case 'success':
      return <CheckCircle2 className={common} aria-hidden />;
    case 'error':
      return <XCircle className={common} aria-hidden />;
    case 'warning':
      return <AlertTriangle className={common} aria-hidden />;
    default:
      return <Info className={common} aria-hidden />;
  }
}

export function AlertBanner({
  open,
  variant = 'info',
  title,
  description,
  className,
  autoClose,
  onClose,
}: AlertBannerProps) {
  useEffect(() => {
    if (!open || !autoClose || !onClose) return;
    const t = setTimeout(onClose, autoClose);
    return () => clearTimeout(t);
  }, [open, autoClose, onClose]);

  const vs = variantStyles[variant];

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="alert-banner"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          role={vs.role}
          aria-live={vs.ariaLive}
          className={cn(
            'relative flex w-full items-start gap-2 rounded-md px-3 py-2 text-sm ring-1',
            vs.container,
            vs.ring,
            className
          )}
        >
          <div className={cn('mt-0.5', vs.iconColor)}>
            <VariantIcon variant={variant} />
          </div>
          <div className="flex-1 min-w-0">
            {title && <p className="font-medium leading-5 truncate">{title}</p>}
            {description && (
              <p className={cn('leading-5', title ? 'mt-0.5 text-xs opacity-90' : '')}>
                {description}
              </p>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-offset-2"
              aria-label="Dismiss"
            >
              <X className={cn('h-3.5 w-3.5', vs.iconColor)} />
            </button>
          )}
          {autoClose ? (
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: autoClose / 1000, ease: 'linear' }}
              className={cn('absolute bottom-0 left-0 right-0 h-0.5 origin-left', vs.bar)}
            />
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default AlertBanner;
