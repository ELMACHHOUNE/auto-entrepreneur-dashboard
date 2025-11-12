import React from 'react';

/**
 * Branded animated loader.
 * Accepts a size and optional label for accessibility.
 */
export interface LoaderProps {
  size?: number; // pixel size (square)
  className?: string;
  label?: string; // aria-label override
  inline?: boolean; // if true, don't center container
}

export const Loader: React.FC<LoaderProps> = ({
  size = 60,
  className = '',
  label = 'Loading',
  inline = false,
}) => {
  return (
    <div
      className={
        inline
          ? `inline-flex items-center justify-center ${className}`
          : `flex items-center justify-center ${className}`
      }
      role="status"
      aria-label={label}
    >
      {/* Tailwind-only concentric spinner */}
      <div className="relative" style={{ width: size, height: size }} aria-hidden="true">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin animation-duration-[1.2s]" />
        {/* Inner ring (reverse spin) */}
        <div className="absolute inset-2 rounded-full border-4 border-accent/30 border-b-accent animate-spin animation-duration-[1.8s] direction-[reverse]" />
        {/* Center pulse */}
        <div className="absolute inset-1 grid place-items-center">
          <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Loader;
