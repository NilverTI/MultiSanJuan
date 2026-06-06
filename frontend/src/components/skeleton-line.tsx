import { cn } from '@/lib/utils';

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded', className)} />;
}
