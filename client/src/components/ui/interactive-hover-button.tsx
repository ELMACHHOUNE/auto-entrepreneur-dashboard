import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export function InteractiveHoverButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        // Base button styles
        'group relative w-auto cursor-pointer overflow-hidden rounded-full border bg-background px-6 py-2 text-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {/* Animated background fill that expands to full width on hover */}
      <span className="absolute inset-y-0 left-0 z-0 w-0 bg-primary transition-all duration-300 ease-out group-hover:w-full" />

      {/* Default content that slides out on hover */}
      <span className="relative z-10 inline-flex items-center gap-2 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {children}
      </span>

      {/* Hover content with contrasting text that slides in */}
      <span className="text-primary-foreground absolute inset-0 z-10 flex translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        <span>{children}</span>
        <ArrowRight />
      </span>
    </button>
  );
}
