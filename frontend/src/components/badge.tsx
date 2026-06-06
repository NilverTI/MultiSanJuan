import { cn } from '@/lib/utils';

export type StockStatus = 'ok' | 'low' | 'out' | 'over';

const STATUS_STYLES: Record<StockStatus, string> = {
  ok: 'badge-success',
  low: 'badge-warning',
  out: 'badge-danger',
  over: 'badge-info',
};

const STATUS_LABELS: Record<StockStatus, string> = {
  ok: 'Disponible',
  low: 'Bajo Stock',
  out: 'Sin Stock',
  over: 'Sobrestock',
};

export function Badge({ status }: { status: StockStatus }) {
  return <span className={cn('badge', STATUS_STYLES[status])}>{STATUS_LABELS[status]}</span>;
}
