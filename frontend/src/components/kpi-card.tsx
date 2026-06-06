'use client';

import { memo } from 'react';
import { ArrowUp, ArrowDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAccentStyle } from '@/lib/chart-helpers';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  color: string;
  trend?: 'up' | 'down';
  trendLabel?: string;
  loading?: boolean;
}

export const KpiCard = memo(function KpiCard({ title, value, subtitle, icon: Icon, color, trend, trendLabel, loading }: KpiCardProps) {
  const { accent, bg } = getAccentStyle(color);
  return (
    <div className={cn('stat-card', loading && 'opacity-60')} style={{ '--card-accent': accent } as React.CSSProperties}>
      <div className="flex items-center justify-between">
        <span className="stat-label">{title}</span>
        {Icon && (
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg, color: accent }}>
            <Icon size={22} />
          </div>
        )}
      </div>
      <div className={cn('stat-value', loading && 'skeleton-text !h-8 !w-2/3 mt-3')}>
        {loading ? '' : value}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          {trend && (
            <span className={trend === 'up' ? 'text-success' : 'text-danger'}>
              {trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            </span>
          )}
          {subtitle}
          {trendLabel && <span className="text-[11px] text-muted-foreground/60">{trendLabel}</span>}
        </p>
      )}
    </div>
  );
});
