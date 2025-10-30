import React from 'react';

export default function BackgroundGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 49%, var(--grid-line-color) 49%, var(--grid-line-color) 51%, transparent 51%),
            linear-gradient(-45deg, transparent 49%, var(--grid-line-color) 49%, var(--grid-line-color) 51%, transparent 51%)
          `,
          backgroundSize: '40px 40px',
          WebkitMaskImage:
            'radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)',
          maskImage: 'radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
