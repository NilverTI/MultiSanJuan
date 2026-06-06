'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md p-8">
        <h2 className="text-xl font-bold mb-2">Algo salió mal</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          {error.message || 'Ocurrió un error inesperado al cargar la página.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
