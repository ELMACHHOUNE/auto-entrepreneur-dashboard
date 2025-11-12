import React, { useEffect } from 'react';
import Loader from './Loader';
import { useNavigate } from 'react-router-dom';

interface ErrorPageProps {
  code?: number | string;
  message?: string;
  redirectTo?: string;
  redirectDelayMs?: number;
}

/**
 * Full-screen error state with same concentric style as Loader.
 * Automatically redirects after a delay (default 3000ms) to home.
 */
export const ErrorPage: React.FC<ErrorPageProps> = ({
  code = 404,
  message = 'Page not found',
  redirectTo = '/',
  redirectDelayMs = 3000,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate(redirectTo), redirectDelayMs);
    return () => clearTimeout(t);
  }, [navigate, redirectTo, redirectDelayMs]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center"
      role="alert"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader size={96} label={`Error ${code}`} />
        <div className="space-y-2">
          <h1
            className="text-4xl font-extrabold tracking-tight text-destructive tabular-nums"
            aria-label={`Error code ${code}`}
          >
            {code}
          </h1>
          <p className="text-lg font-medium text-muted-foreground">{message}</p>
          <p className="text-sm text-muted-foreground/80">Redirecting to home in 3 seconds…</p>
        </div>
      </div>
      <button
        onClick={() => navigate(redirectTo)}
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/40"
      >
        Go now
      </button>
    </div>
  );
};

export default ErrorPage;
