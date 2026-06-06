export type Period = 'today' | 'week' | 'month' | 'year' | 'custom';

export type TimelineView = 'daily' | 'weekly' | 'monthly';

export function getDateRange(period: Period): { startDate?: string; endDate?: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (period === 'today') return { startDate: fmt(now) };
  if (period === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    return { startDate: fmt(start), endDate: fmt(now) };
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: fmt(start), endDate: fmt(now) };
  }
  if (period === 'year') {
    const start = new Date(now.getFullYear(), 0, 1);
    return { startDate: fmt(start), endDate: fmt(now) };
  }
  return {};
}
