import type { ReactNode } from 'react';

interface AuthSplitProps {
  children: ReactNode;
  imageUrl?: string;
  imageAlt?: string;
  className?: string;
  heightClass?: string;
  widthClass?: string;
  rightClassName?: string;
}

export default function AuthSplit({
  children,
  imageUrl = '/images/registration.jpg',
  imageAlt = 'Auth illustration',
  className,
  heightClass,
  widthClass,
  rightClassName,
}: AuthSplitProps) {
  // Prefer min-heights to avoid forcing internal scrollbars; allow page to grow naturally
  const heightClasses = heightClass ?? 'md:min-h-[890px] min-h-[520px]';
  const fixedWidth = widthClass ?? 'max-w-[1400px] w-full';
  return (
    <div className={'relative w-full ' + (className ?? '')}>
      {/* Page background */}
      <div className="absolute inset-0 -z-10" />

      <div className={`mx-auto my-6 ${fixedWidth} px-4 sm:my-10`}>
        {/* decorative rotated borders */}
        <div
          className={`pointer-events-none absolute inset-x-4 top-0 bottom-0 z-0 -mx-4 hidden sm:block`}
        >
          <div className="absolute inset-0 -rotate-3 rounded-3xl border border-black/60 dark:border-white/55"></div>
        </div>

        {/* main content card */}
        <div
          className={`relative grid overflow-hidden rounded-3xl bg-white/50 shadow-xl ring-1 ring-black/5 dark:bg-black/50 dark:ring-white/5 md:grid-cols-2 ${heightClasses}`}
        >
          {/* left image */}
          <div className="relative hidden md:block">
            <img
              src={imageUrl}
              alt={imageAlt}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
          </div>

          {/* right content */}
          <div className={rightClassName ?? 'flex h-full w-full items-stretch p-4 sm:p-6 md:p-8 text-foreground'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
