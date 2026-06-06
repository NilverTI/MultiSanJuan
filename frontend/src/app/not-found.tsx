import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md p-8">
        <h2 className="text-4xl font-bold mb-2">404</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          La página que buscas no existe.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
