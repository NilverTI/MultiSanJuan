'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md p-8">
            <h2 className="text-xl font-bold mb-2">Error crítico</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              {error.message || 'Ocurrió un error inesperado.'}
            </p>
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
