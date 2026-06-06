import { DollarSign, Smartphone, Building2, CreditCard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const CHART_COLORS = ['#90CAF9', '#81C784', '#FFB74D', '#EF9A9A', '#CE93D8', '#80CBC4'];

export function getAccentStyle(color: string): { accent: string; bg: string } {
  if (color.includes('success')) return { accent: '#81C784', bg: 'rgba(129,199,132,0.15)' };
  if (color.includes('warning')) return { accent: '#FFB74D', bg: 'rgba(255,183,77,0.15)' };
  if (color.includes('danger')) return { accent: '#EF9A9A', bg: 'rgba(239,154,154,0.15)' };
  if (color.includes('info')) return { accent: '#90CAF9', bg: 'rgba(144,202,249,0.15)' };
  return { accent: '#90CAF9', bg: 'rgba(144,202,249,0.15)' };
}

interface PaymentIconInfo {
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const PAYMENT_ICONS: Record<string, PaymentIconInfo> = {
  CASH: { icon: DollarSign, color: 'text-success', bg: 'bg-success/10' },
  YAPE: { icon: Smartphone, color: 'text-info', bg: 'bg-info/10' },
  PLIN: { icon: Smartphone, color: 'text-info', bg: 'bg-info/10' },
  TRANSFER: { icon: Building2, color: 'text-info', bg: 'bg-info/10' },
  CARD: { icon: CreditCard, color: 'text-warning', bg: 'bg-warning/10' },
  MIXED: { icon: CreditCard, color: 'text-danger', bg: 'bg-danger/10' },
};
