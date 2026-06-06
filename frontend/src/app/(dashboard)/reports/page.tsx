'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { reportsApi } from '@/services/api';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle, DollarSign,
  CreditCard, Smartphone, Building2, Receipt, Store,
  Calendar, Filter, Download, Users, Wallet, PiggyBank, Target,
  BarChart3, LineChart, PieChart as PieChartIcon, Crown, Medal, Trophy,
  ChevronDown, Search, X, RefreshCw, Loader2, Percent,
  TrendingDown, ArrowUp, ArrowDown, Box, ClipboardList, AlertCircle,
  CircleDollarSign, Layers, Truck, Settings, FileSpreadsheet,
  EyeOff, Eye, Zap, Clock, Banana, Scale, Warehouse, Star,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Line, LineChart as ReLineChart, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Period = 'today' | 'week' | 'month' | 'year' | 'custom';
type Tab = 'general' | 'ventas' | 'productos' | 'clientes' | 'inventario' | 'finanzas';
type TimelineView = 'daily' | 'weekly' | 'monthly';
type StockFilter = 'all' | 'low' | 'out' | 'over';

function getDateRange(period: Period): { startDate?: string; endDate?: string } {
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

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo', YAPE: 'Yape', PLIN: 'Plin', TRANSFER: 'Transferencia',
  CARD: 'Tarjeta', MIXED: 'Mixto',
};

const CHART_COLORS = ['#5B9BD5', '#4CAF50', '#FF9800', '#EF5350', '#AB47BC', '#26A69A'];

function getAccentStyle(color: string): { accent: string; bg: string } {
  if (color.includes('success')) return { accent: '#4CAF50', bg: 'rgba(76,175,80,0.15)' };
  if (color.includes('warning')) return { accent: '#FF9800', bg: 'rgba(255,152,0,0.15)' };
  if (color.includes('danger')) return { accent: '#EF5350', bg: 'rgba(239,83,80,0.15)' };
  if (color.includes('info')) return { accent: '#5B9BD5', bg: 'rgba(91,155,213,0.15)' };
  return { accent: '#5B9BD5', bg: 'rgba(91,155,213,0.15)' };
}

function KpiCard({ title, value, subtitle, icon: Icon, color, trend, loading }: {
  title: string; value: string; subtitle?: string; icon: any; color: string;
  trend?: 'up' | 'down'; loading?: boolean;
}) {
  const { accent, bg } = getAccentStyle(color);
  return (
    <div className={cn('stat-card', loading && 'opacity-60')} style={{ '--card-accent': accent } as React.CSSProperties}>
      <div className="flex items-center justify-between">
        <span className="stat-label">{title}</span>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg, color: accent }}>
          {Icon && <Icon size={22} />}
        </div>
      </div>
      <div className={cn('stat-value', loading && 'skeleton-text !h-8 !w-2/3 mt-3')}>{loading ? '' : value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">{subtitle}</p>}
    </div>
  );
}

function Badge({ status }: { status: 'ok' | 'low' | 'out' | 'over' }) {
  const styles: Record<string, string> = {
    ok: 'badge-success',
    low: 'badge-warning',
    out: 'badge-danger',
    over: 'badge-info',
  };
  const labels: Record<string, string> = {
    ok: 'Disponible',
    low: 'Bajo Stock',
    out: 'Sin Stock',
    over: 'Sobrestock',
  };
  return <span className={cn('badge', styles[status])}>{labels[status]}</span>;
}

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'general', label: 'General', icon: BarChart3 },
  { key: 'ventas', label: 'Ventas', icon: TrendingUp },
  { key: 'productos', label: 'Productos', icon: Package },
  { key: 'clientes', label: 'Clientes', icon: Users },
  { key: 'inventario', label: 'Inventario / Stock', icon: Warehouse },
  { key: 'finanzas', label: 'Finanzas', icon: CircleDollarSign },
];

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded', className)} />;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [period, setPeriod] = useState<Period>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [timelineView, setTimelineView] = useState<TimelineView>('daily');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  const [salesData, setSalesData] = useState<any>(null);
  const [productsData, setProductsData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [stockAlerts, setStockAlerts] = useState<any>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const loadAll = useCallback(async () => {
    const params: Record<string, any> = {};
    if (period === 'custom' && customStart) {
      params.startDate = customStart;
      if (customEnd) params.endDate = customEnd;
    } else {
      const range = getDateRange(period);
      if (range.startDate) params.startDate = range.startDate;
      if (range.endDate) params.endDate = range.endDate;
    }

    const loaders: Record<string, Promise<void>> = {};

    loaders.sales = (async () => {
      setLoading(p => ({ ...p, sales: true }));
      try { setSalesData(await reportsApi.sales(params)); } catch { toast.error('Error al cargar ventas'); }
      finally { setLoading(p => ({ ...p, sales: false })); }
    })();

    loaders.products = (async () => {
      setLoading(p => ({ ...p, products: true }));
      try { setProductsData(await reportsApi.products()); }
      catch { toast.error('Error al cargar productos'); }
      finally { setLoading(p => ({ ...p, products: false })); }
    })();

    loaders.inventory = (async () => {
      setLoading(p => ({ ...p, inventory: true }));
      try { setInventoryData(await reportsApi.inventory()); }
      catch { toast.error('Error al cargar inventario'); }
      finally { setLoading(p => ({ ...p, inventory: false })); }
    })();

    loaders.financial = (async () => {
      setLoading(p => ({ ...p, financial: true }));
      try { setFinancialData(await reportsApi.financial(params)); }
      catch { toast.error('Error al cargar finanzas'); }
      finally { setLoading(p => ({ ...p, financial: false })); }
    })();

    loaders.customers = (async () => {
      setLoading(p => ({ ...p, customers: true }));
      try { setCustomerData(await reportsApi.customers(params)); }
      catch { toast.error('Error al cargar clientes'); }
      finally { setLoading(p => ({ ...p, customers: false })); }
    })();

    loaders.stock = (async () => {
      setLoading(p => ({ ...p, stock: true }));
      try { setStockAlerts(await reportsApi.stockAlerts()); }
      catch { toast.error('Error al cargar alertas'); }
      finally { setLoading(p => ({ ...p, stock: false })); }
    })();

    await Promise.all(Object.values(loaders));
  }, [period, customStart, customEnd]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const isBusy = (key: string) => loading[key];

  const productChartData = useMemo(() => {
    if (!salesData?.sales) return [];
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const sale of salesData.sales) {
      for (const item of sale.items) {
        const pid = item.productId;
        const existing = map.get(pid) || { name: item.product?.name || item.productName, qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += Number(item.total);
        map.set(pid, existing);
      }
    }
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.qty - a.qty);
  }, [salesData]);

  const customerChartData = useMemo(() => {
    if (!customerData?.topBySpent) return [];
    return customerData.topBySpent.slice(0, 10).map((c: any) => ({
      name: `${c.firstName} ${c.lastName}`.length > 16 ? `${c.firstName} ${c.lastName}`.slice(0, 14) + '…' : `${c.firstName} ${c.lastName}`,
      Gastos: c.totalSpent,
      Compras: c.salesCount,
    }));
  }, [customerData]);

  const paymentChartData = useMemo(() => {
    if (!salesData?.summary?.byPaymentMethod) return [];
    return Object.entries(salesData.summary.byPaymentMethod).map(([method, total]) => ({
      name: PAYMENT_LABELS[method] || method,
      value: total as number,
    }));
  }, [salesData]);

  const timelineData = useMemo(() => {
    if (!salesData?.sales) return [];
    if (timelineView === 'daily') {
      const map = new Map<string, { date: string; revenue: number; count: number }>();
      for (const sale of salesData.sales) {
        const key = sale.createdAt.slice(0, 10);
        const existing = map.get(key) || { date: key, revenue: 0, count: 0 };
        existing.revenue += Number(sale.total);
        existing.count += 1;
        map.set(key, existing);
      }
      return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
    if (timelineView === 'weekly') {
      const map = new Map<string, { week: string; revenue: number; count: number }>();
      for (const sale of salesData.sales) {
        const d = new Date(sale.createdAt);
        const weekStart = new Date(d);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const key = weekStart.toISOString().slice(0, 10);
        const existing = map.get(key) || { week: `Sem ${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}`, revenue: 0, count: 0 };
        existing.revenue += Number(sale.total);
        existing.count += 1;
        map.set(key, existing);
      }
      return Array.from(map.values());
    }
    if (timelineView === 'monthly') {
      const map = new Map<string, { month: string; revenue: number; count: number }>();
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      for (const sale of salesData.sales) {
        const d = new Date(sale.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const existing = map.get(key) || { month: monthNames[d.getMonth()] || key, revenue: 0, count: 0 };
        existing.revenue += Number(sale.total);
        existing.count += 1;
        map.set(key, existing);
      }
      return Array.from(map.values());
    }
    return [];
  }, [salesData, timelineView]);

  const financialSummary = financialData;

  const bestDay: any = useMemo(() => {
    if (!timelineData.length) return null;
    return timelineData.reduce((a: any, b: any) => (a.revenue > b.revenue ? a : b));
  }, [timelineData]);

  const filteredProducts = useMemo(() => {
    if (!inventoryData?.products) return [];
    let list = inventoryData.products;
    if (stockFilter === 'low') list = list.filter((p: any) => p.stock > 0 && p.stock <= p.minStock);
    else if (stockFilter === 'out') list = list.filter((p: any) => p.stock === 0);
    else if (stockFilter === 'over') list = list.filter((p: any) => p.maxStock && p.stock > p.maxStock);
    return list;
  }, [inventoryData, stockFilter]);

  const getStockStatus = (stock: number, minStock: number, maxStock: number | null): 'ok' | 'low' | 'out' | 'over' => {
    if (stock <= 0) return 'out';
    if (maxStock && stock > maxStock) return 'over';
    if (stock <= minStock) return 'low';
    return 'ok';
  };

  return (
    <div className="page-container dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Análisis completo del negocio — ventas, productos, clientes, stock y finanzas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-[#1E1E1E] rounded-2xl p-1 border border-[rgba(255,255,255,0.08)]">
            {(['today', 'week', 'month', 'year'] as Period[]).map(p => (
              <button key={p} onClick={() => { setPeriod(p); setCustomStart(''); setCustomEnd(''); }}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200',
                  period === p ? 'bg-[#5B9BD5] text-white font-bold shadow-[0_4px_14px_rgba(91,155,213,0.35)]' : 'text-[#BDBDBD] hover:text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.06)]')}>
                {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
              </button>
            ))}
            <button onClick={() => setPeriod('custom')}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200',
                period === 'custom' ? 'bg-[#5B9BD5] text-white font-bold shadow-[0_4px_14px_rgba(91,155,213,0.35)]' : 'text-[#BDBDBD] hover:text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.06)]')}>
              <Calendar size={12} className="inline mr-1" />Personalizado
            </button>
          </div>
          <button onClick={loadAll} className="btn-ghost btn-sm" title="Actualizar">
            <RefreshCw size={14} className={cn(Object.values(loading).some(Boolean) && 'animate-spin')} />
          </button>
        </div>
      </div>

      {period === 'custom' && (
        <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl" style={{ background: 'rgba(91,155,213,0.08)', border: '1px solid rgba(91,155,213,0.15)' }}>
          <Calendar size={16} style={{ color: '#5B9BD5' }} />
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
            className="input-field !w-auto !h-9 text-sm" />
          <span className="text-muted-foreground text-xs">a</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
            className="input-field !w-auto !h-9 text-sm" />
          <button onClick={loadAll} className="btn-primary btn-sm">Aplicar</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-thin">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-[#5B9BD5] text-white shadow-[0_4px_14px_rgba(91,155,213,0.35)]'
                : 'text-[#BDBDBD] hover:text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.06)]')}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============ GENERAL ============ */}
      {activeTab === 'general' && (
        <div className="space-y-6 animate-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Ventas Totales" value={String(salesData?.summary?.totalSales || 0)}
              subtitle={`${formatCurrency(salesData?.summary?.totalRevenue || 0)} en ingresos`}
              icon={ShoppingCart} color="text-info" loading={isBusy('sales')} />
            <KpiCard title="Ganancia Neta" value={formatCurrency(financialSummary?.netProfit || 0)}
              subtitle={`Margen: ${financialSummary?.profitMargin || 0}%`}
              icon={PiggyBank} color={(financialSummary?.netProfit || 0) >= 0 ? 'text-success' : 'text-danger'}
              loading={isBusy('financial')} />
            <KpiCard title="Inventario Valorizado" value={formatCurrency(inventoryData?.inventoryValue || 0)}
              subtitle={`${inventoryData?.totalProducts || 0} productos en total`}
              icon={Wallet} color="text-info" loading={isBusy('inventory')} />
            <KpiCard title="Clientes" value={String(customerData?.totalCustomers || 0)}
              subtitle="Compraron en el período"
              icon={Users} color="text-info" loading={isBusy('customers')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard title="Prod. Vendidos" value={String(financialSummary?.totalSalesCount || 0)}
              subtitle={`Ticket prom: ${formatCurrency(financialSummary?.avgTicket || 0)}`}
              icon={Package} color="text-info" loading={isBusy('financial')} />
            <KpiCard title="Inversión Total" value={formatCurrency(financialSummary?.totalCost || 0)}
              icon={TrendingDown} color="text-warning" loading={isBusy('financial')} />
            <KpiCard title="Stock Bajo" value={String(stockAlerts?.lowStockCount || 0)}
              subtitle={`${stockAlerts?.noStockCount || 0} sin stock`}
              icon={AlertTriangle} color="text-warning" loading={isBusy('stock')} />
            <KpiCard title="Sin Stock" value={String(stockAlerts?.noStockCount || 0)}
              icon={AlertCircle} color="text-danger" loading={isBusy('stock')} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-modern p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-base">
                <LineChart size={18} className="text-primary" />
                Evolución de Ventas
              </h3>
              <div className="flex gap-1 mb-4">
                {(['daily', 'weekly', 'monthly'] as TimelineView[]).map(v => (
                  <button key={v} onClick={() => setTimelineView(v)}
                    className={cn('px-3 py-1 text-xs font-medium rounded-lg transition-all',
                      timelineView === v ? 'bg-[rgba(91,155,213,0.18)] text-[#5B9BD5]' : 'text-[#BDBDBD] hover:text-[#F5F5F5]')}>
                    {v === 'daily' ? 'Diario' : v === 'weekly' ? 'Semanal' : 'Mensual'}
                  </button>
                ))}
              </div>
              {isBusy('sales') ? <SkeletonLine className="h-[220px] w-full" />
                : timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <ReLineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey={timelineView === 'weekly' ? 'week' : timelineView === 'monthly' ? 'month' : 'date'}
                        tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}
                        formatter={(value: any) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="revenue" stroke="#5B9BD5" strokeWidth={2.5} dot={{ r: 3, fill: '#5B9BD5' }} activeDot={{ r: 5, fill: '#5B9BD5' }} />
                  </ReLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">Sin datos</div>
              )}
          </div>

            <div className="card-modern p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-base">
                <PieChartIcon size={18} className="text-primary" />
                Ventas por Método de Pago
              </h3>
              {isBusy('sales') ? <SkeletonLine className="h-[220px] w-full" />
                : paymentChartData.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={paymentChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                          paddingAngle={3} dataKey="value">
                          {paymentChartData.map((_: any, i: number) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}
                          formatter={(value: any) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 min-w-[130px]">
                      {paymentChartData.map((p: any, i: number) => (
                        <div key={p.name} className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-muted-foreground">{p.name}</span>
                          <span className="font-medium ml-auto">{formatCurrency(p.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">Sin datos</div>
                )}
            </div>
          </div>

          {stockAlerts && (stockAlerts.noStockCount > 0 || stockAlerts.lowStockCount > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockAlerts.noStockCount > 0 && (
                <div className="card-modern p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,83,80,0.15)', color: '#EF5350' }}>
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: '#EF5350' }}>{stockAlerts.noStockCount}</p>
                    <p className="text-xs text-muted-foreground">Productos sin stock — requieren reposición urgente</p>
                  </div>
                </div>
              )}
              {stockAlerts.lowStockCount > 0 && (
                <div className="card-modern p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,152,0,0.15)', color: '#FF9800' }}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: '#FF9800' }}>{stockAlerts.lowStockCount}</p>
                    <p className="text-xs text-muted-foreground">Productos con bajo stock — próximos a agotarse</p>
                  </div>
                </div>
              )}
              {stockAlerts.overStockCount > 0 && (
                <div className="card-modern p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,155,213,0.15)', color: '#5B9BD5' }}>
                    <Box size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: '#5B9BD5' }}>{stockAlerts.overStockCount}</p>
                    <p className="text-xs text-muted-foreground">Productos con sobrestock — mucha inversión detenida</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============ VENTAS ============ */}
      {activeTab === 'ventas' && (
        <div className="space-y-6 animate-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Vendido" value={formatCurrency(salesData?.summary?.totalRevenue || 0)}
              icon={TrendingUp} color="text-success" loading={isBusy('sales')} />
            <KpiCard title="Cantidad Ventas" value={String(salesData?.summary?.totalSales || 0)}
              icon={ShoppingCart} color="text-info" loading={isBusy('sales')} />
            <KpiCard title="Descuentos" value={formatCurrency(salesData?.summary?.totalDiscount || 0)}
              icon={Percent} color="text-danger" loading={isBusy('sales')} />
            <KpiCard title="IGV Total" value={formatCurrency(salesData?.summary?.totalIgv || 0)}
              icon={Receipt} color="text-info" loading={isBusy('sales')} />
          </div>

          {bestDay && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card-modern p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50' }}>
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Mejor Día</p>
                  <p className="font-bold">{bestDay.date}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(bestDay.revenue)} · {bestDay.count} ventas</p>
                </div>
              </div>
              <div className="card-modern p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,155,213,0.15)', color: '#5B9BD5' }}>
                  <BarChart3 size={24} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Ticket Promedio</p>
                  <p className="font-bold">{formatCurrency(financialSummary?.avgTicket || 0)}</p>
                  <p className="text-xs text-muted-foreground">Por transacción</p>
                </div>
              </div>
              <div className="card-modern p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,152,0,0.15)', color: '#FF9800' }}>
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Por Vendedor</p>
                  <p className="font-bold">{salesData?.summary?.byUser ? Object.keys(salesData.summary.byUser).length : 0}</p>
                  <p className="text-xs text-muted-foreground">Vendedores activos</p>
                </div>
              </div>
            </div>
          )}

          <div className="card-modern p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-base">
              <LineChart size={18} className="text-primary" />
              Evolución de Ventas
            </h3>
            <div className="flex gap-1 mb-4">
              {(['daily', 'weekly', 'monthly'] as TimelineView[]).map(v => (
                <button key={v} onClick={() => setTimelineView(v)}
                  className={cn('px-3 py-1 text-xs font-medium rounded-lg transition-all',
                    timelineView === v ? 'bg-[rgba(91,155,213,0.18)] text-[#5B9BD5]' : 'text-[#BDBDBD] hover:text-[#F5F5F5]')}>
                  {v === 'daily' ? 'Por Día' : v === 'weekly' ? 'Por Semana' : 'Por Mes'}
                </button>
              ))}
            </div>
            {isBusy('sales') ? <SkeletonLine className="h-[250px] w-full" />
              : timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <ReLineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey={timelineView === 'weekly' ? 'week' : timelineView === 'monthly' ? 'month' : 'date'}
                      tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}
                      formatter={(value: any) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="revenue" stroke="#5B9BD5" strokeWidth={2.5} dot={{ r: 3, fill: '#5B9BD5' }} activeDot={{ r: 5, fill: '#5B9BD5' }} />
                  </ReLineChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">Sin datos</div>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-modern p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-base">
                <Package size={18} className="text-primary" />
                Productos Más Vendidos
              </h3>
              {isBusy('sales') ? <SkeletonLine className="h-[200px] w-full" />
                : productChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={productChartData.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}
                        formatter={(value: any, name: any) => name === 'qty' ? `${value} uds` : formatCurrency(value)} />
                      <Bar dataKey="qty" fill="#5B9BD5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">Sin datos</div>}
            </div>

            <div className="card-modern p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-base">
                <DollarSign size={18} className="text-primary" />
                Ventas por Vendedor
              </h3>
              {isBusy('sales') ? <SkeletonLine className="h-[200px] w-full" />
                : salesData?.summary?.byUser && Object.keys(salesData.summary.byUser).length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {Object.entries(salesData.summary.byUser).map(([name, data]: [string, any]) => (
                      <div key={name} className="flex items-center justify-between py-3 px-2 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[rgba(91,155,213,0.18)] flex items-center justify-center text-xs font-bold text-[#5B9BD5]">
                            {name[0]}
                          </div>
                          <span className="text-sm font-medium">{name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(data.total)}</p>
                          <p className="text-xs text-muted-foreground">{data.count} ventas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">Sin datos</div>}
            </div>
          </div>
        </div>
      )}

      {/* ============ PRODUCTOS ============ */}
      {activeTab === 'productos' && (
        <div className="space-y-6 animate-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Productos" value={String(productsData?.totalProducts || 0)}
              icon={Package} color="text-info" loading={isBusy('products')} />
            <KpiCard title="Activos" value={String(productsData?.activeProducts || 0)}
              icon={CheckCircle} color="text-success" loading={isBusy('products')} />
            <KpiCard title="Stock Bajo" value={String(productsData?.lowStock || 0)}
              icon={AlertTriangle} color="text-warning" loading={isBusy('products')} />
            <KpiCard title="Sin Stock" value={String(productsData?.outOfStock || 0)}
              icon={AlertCircle} color="text-danger" loading={isBusy('products')} />
          </div>

          <div className="card-modern p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-base">
              <BarChart3 size={18} className="text-primary" />
              Ranking de Productos más Vendidos
            </h3>
            {isBusy('sales') ? <SkeletonLine className="h-[200px] w-full" />
              : productChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={productChartData.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}
                      formatter={(value: any, name: any) => name === 'qty' ? `${value} uds` : formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#4CAF50" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">Sin datos de ventas</div>}
          </div>

          <div className="card-modern overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h3 className="font-semibold flex items-center gap-2 text-base">
                <ClipboardList size={18} className="text-primary" />
                Detalle de Productos
              </h3>
            </div>
            {isBusy('products') ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <SkeletonLine key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Código</th>
                      <th className="table-header-cell">Producto</th>
                      <th className="table-header-cell">Categoría</th>
                      <th className="table-header-cell">Stock</th>
                      <th className="table-header-cell">P. Venta</th>
                      <th className="table-header-cell">P. Compra</th>
                      <th className="table-header-cell">Valor Stock</th>
                      <th className="table-header-cell">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredProducts.slice(0, 30).map((p: any) => (
                      <tr key={p.id} className="table-row">
                        <td className="table-cell font-mono text-xs">{p.sku}</td>
                        <td className="table-cell font-medium">{p.name}</td>
                        <td className="table-cell text-muted-foreground">{p.category?.name || '-'}</td>
                        <td className="table-cell">
                          <span className={cn('font-semibold', p.stock === 0 ? 'text-danger' : p.stock <= p.minStock ? 'text-warning' : '')}>
                            {p.stock} {p.unitType || 'und'}
                          </span>
                        </td>
                        <td className="table-cell">{formatCurrency(p.salePrice)}</td>
                        <td className="table-cell text-muted-foreground">{formatCurrency(p.purchasePrice || 0)}</td>
                        <td className="table-cell font-semibold">{formatCurrency((p.purchasePrice || 0) * Math.max(p.stock, 0))}</td>
                        <td className="table-cell"><Badge status={getStockStatus(p.stock, p.minStock, p.maxStock)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ CLIENTES ============ */}
      {activeTab === 'clientes' && (
        <div className="space-y-6 animate-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="Total Clientes" value={String(customerData?.totalCustomers || 0)}
              subtitle="Compraron en el período"
              icon={Users} color="text-info" loading={isBusy('customers')} />
            <KpiCard title="Top Cliente" value={customerData?.topBySpent?.[0] ? `${customerData.topBySpent[0].firstName} ${customerData.topBySpent[0].lastName}` : '-'}
              subtitle={customerData?.topBySpent?.[0] ? formatCurrency(customerData.topBySpent[0].totalSpent) : ''}
              icon={Crown} color="text-warning" loading={isBusy('customers')} />
            <KpiCard title="Más Frecuente" value={customerData?.topByFrequency?.[0] ? `${customerData.topByFrequency[0].firstName} ${customerData.topByFrequency[0].lastName}` : '-'}
              subtitle={customerData?.topByFrequency?.[0] ? `${customerData.topByFrequency[0].salesCount} compras` : ''}
              icon={Star} color="text-info" loading={isBusy('customers')} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-modern p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-base">
                <DollarSign size={18} className="text-primary" />
                Top por Monto Gastado
              </h3>
              {isBusy('customers') ? <SkeletonLine className="h-[220px] w-full" />
                : customerChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={customerChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}
                        formatter={(value: any) => formatCurrency(value)} />
                      <Bar dataKey="Gastos" fill="#5B9BD5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">Sin datos</div>}
            </div>

            <div className="card-modern">
              <div className="p-6 border-b border-border/50">
                <h3 className="font-semibold flex items-center gap-2 text-base">
                  <Crown size={18} className="text-primary" />
                  Ranking de Clientes
                </h3>
              </div>
              {isBusy('customers') ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => <SkeletonLine key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {(customerData?.topBySpent || []).slice(0, 10).map((c: any, i: number) => (
                    <div key={c.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                          i === 0 ? 'bg-[#C69249]/10 text-warning' :
                          i === 1 ? 'bg-[#8D8D8D]/10 text-[#8D8D8D]' :
                          i === 2 ? 'bg-[#C69249]/10 text-warning' :
                          'bg-[#303030] text-muted-foreground')}>{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-muted-foreground">{c.salesCount} compras · {c.totalProducts} prod.</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(c.totalSpent)}</p>
                      </div>
                    </div>
                  ))}
                  {(!customerData?.topBySpent || customerData.topBySpent.length === 0) && (
                    <div className="p-8 text-center text-sm text-muted-foreground">Sin datos de clientes</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card-modern">
            <div className="p-6 border-b border-border/50">
              <h3 className="font-semibold flex items-center gap-2 text-base">
                <Users size={18} className="text-primary" />
                Clientes más Frecuentes
              </h3>
            </div>
            {isBusy('customers') ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <SkeletonLine key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">#</th>
                      <th className="table-header-cell">Cliente</th>
                      <th className="table-header-cell">Contacto</th>
                      <th className="table-header-cell">Compras</th>
                      <th className="table-header-cell">Productos</th>
                      <th className="table-header-cell">Total Gastado</th>
                      <th className="table-header-cell">Última Compra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {(customerData?.topByFrequency || []).slice(0, 15).map((c: any, i: number) => (
                      <tr key={c.id} className="table-row">
                        <td className="table-cell text-muted-foreground">{i + 1}</td>
                        <td className="table-cell font-medium">{c.firstName} {c.lastName}</td>
                        <td className="table-cell text-muted-foreground text-xs">{c.email || c.phone || '-'}</td>
                        <td className="table-cell font-semibold">{c.salesCount}</td>
                        <td className="table-cell">{c.totalProducts}</td>
                        <td className="table-cell font-semibold">{formatCurrency(c.totalSpent)}</td>
                        <td className="table-cell text-xs text-muted-foreground">
                          {c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString('es-PE') : '-'}
                        </td>
                      </tr>
                    ))}
                    {(!customerData?.topByFrequency || customerData.topByFrequency.length === 0) && (
                      <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">Sin datos de clientes</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ INVENTARIO / STOCK ============ */}
      {activeTab === 'inventario' && (
        <div className="space-y-6 animate-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Productos" value={String(inventoryData?.totalProducts || 0)}
              icon={Package} color="text-info" loading={isBusy('inventory')} />
            <KpiCard title="Stock Total" value={String(inventoryData?.totalStock || 0)}
              icon={Layers} color="text-success" loading={isBusy('inventory')} />
            <KpiCard title="Inventario Valorizado" value={formatCurrency(inventoryData?.inventoryValue || 0)}
              icon={Wallet} color="text-info" loading={isBusy('inventory')} />
            <KpiCard title="Movimientos" value={String(inventoryData?.totalMovements || 0)}
              icon={Truck} color="text-info" loading={isBusy('inventory')} />
          </div>

           {stockAlerts && (stockAlerts.noStockCount > 0 || stockAlerts.lowStockCount > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card-modern p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239,83,80,0.15)', color: '#EF5350' }}>
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: '#EF5350' }}>{stockAlerts.noStockCount}</p>
                  <p className="text-xs text-muted-foreground">Sin stock — reposición urgente</p>
                </div>
              </div>
              <div className="card-modern p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,152,0,0.15)', color: '#FF9800' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: '#FF9800' }}>{stockAlerts.lowStockCount}</p>
                  <p className="text-xs text-muted-foreground">Bajo stock — próximos a agotarse</p>
                </div>
              </div>
              <div className="card-modern p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(91,155,213,0.15)', color: '#5B9BD5' }}>
                  <Box size={24} />
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: '#5B9BD5' }}>{stockAlerts.overStockCount}</p>
                  <p className="text-xs text-muted-foreground">Sobrestock — mucha inversión detenida</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-1 mb-2">
            {([['all', 'Todos'], ['low', 'Bajo Stock'], ['out', 'Sin Stock'], ['over', 'Sobrestock']] as [StockFilter, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setStockFilter(key)}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  stockFilter === key ? 'bg-[rgba(91,155,213,0.18)] text-[#5B9BD5]' : 'text-[#BDBDBD] hover:text-[#F5F5F5]')}>
                {label}
              </button>
            ))}
          </div>

          <div className="card-modern overflow-hidden">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2 text-base">
                <ClipboardList size={18} className="text-primary" />
                Stock Actual
              </h3>
              <span className="text-xs text-muted-foreground">
                {filteredProducts.length} productos
              </span>
            </div>
            {isBusy('inventory') ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <SkeletonLine key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Código</th>
                      <th className="table-header-cell">Producto</th>
                      <th className="table-header-cell">Categoría</th>
                      <th className="table-header-cell">Marca</th>
                      <th className="table-header-cell">Stock Actual</th>
                      <th className="table-header-cell">Stock Min</th>
                      <th className="table-header-cell">Stock Max</th>
                      <th className="table-header-cell">Costo</th>
                      <th className="table-header-cell">P. Venta</th>
                      <th className="table-header-cell">Valor Stock</th>
                      <th className="table-header-cell">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredProducts.slice(0, 50).map((p: any) => (
                      <tr key={p.id} className="table-row">
                        <td className="table-cell font-mono text-xs">{p.sku}</td>
                        <td className="table-cell font-medium">{p.name}</td>
                        <td className="table-cell text-muted-foreground">{p.category?.name || '-'}</td>
                        <td className="table-cell text-muted-foreground">{p.brand?.name || '-'}</td>
                        <td className="table-cell">
                          <span className={cn('font-semibold',
                            p.stock === 0 ? 'text-danger' : p.stock <= p.minStock ? 'text-warning' : p.maxStock && p.stock > p.maxStock ? 'text-info' : '')}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="table-cell text-muted-foreground">{p.minStock}</td>
                        <td className="table-cell text-muted-foreground">{p.maxStock || '-'}</td>
                        <td className="table-cell">{formatCurrency(p.purchasePrice || 0)}</td>
                        <td className="table-cell">{formatCurrency(p.salePrice)}</td>
                        <td className="table-cell font-semibold">{formatCurrency((p.purchasePrice || 0) * Math.max(p.stock, 0))}</td>
                        <td className="table-cell"><Badge status={getStockStatus(p.stock, p.minStock, p.maxStock)} /></td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr><td colSpan={11} className="p-8 text-center text-sm text-muted-foreground">No hay productos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-modern p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-base">
                <Box size={18} className="text-primary" />
                Productos Sin Stock
              </h3>
              {isBusy('stock') ? <SkeletonLine className="h-[150px] w-full" />
                : (stockAlerts?.noStock || []).length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {stockAlerts.noStock.slice(0, 10).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/20">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
                        </div>
                        <Badge status="out" />
                      </div>
                    ))}
                  </div>
                ) : <div className="flex items-center justify-center h-[150px] text-sm text-muted-foreground">Sin productos sin stock</div>}
            </div>

            <div className="card-modern p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-base">
                <AlertTriangle size={18} className="text-primary" />
                Productos con Bajo Stock
              </h3>
              {isBusy('stock') ? <SkeletonLine className="h-[150px] w-full" />
                : (stockAlerts?.lowStock || []).length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {stockAlerts.lowStock.slice(0, 10).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/20">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">Stock: {p.stock} / Mín: {p.minStock}</p>
                        </div>
                        <Badge status="low" />
                      </div>
                    ))}
                  </div>
                ) : <div className="flex items-center justify-center h-[150px] text-sm text-muted-foreground">Sin productos con bajo stock</div>}
            </div>
          </div>
        </div>
      )}

      {/* ============ FINANZAS ============ */}
      {activeTab === 'finanzas' && (
        <div className="space-y-6 animate-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Ingresado" value={formatCurrency(financialSummary?.totalRevenue || 0)}
              icon={TrendingUp} color="text-success" loading={isBusy('financial')} />
            <KpiCard title="Total Invertido" value={formatCurrency(financialSummary?.totalCost || 0)}
              icon={TrendingDown} color="text-warning" loading={isBusy('financial')} />
            <KpiCard title="Ganancia Neta" value={formatCurrency(financialSummary?.netProfit || 0)}
              subtitle={financialSummary?.netProfit >= 0 ? 'Utilidad positiva' : 'Pérdida'}
              trend={financialSummary?.netProfit >= 0 ? 'up' : 'down'}
              icon={PiggyBank} color={(financialSummary?.netProfit || 0) >= 0 ? 'text-success' : 'text-danger'} loading={isBusy('financial')} />
            <KpiCard title="Margen de Ganancia" value={`${financialSummary?.profitMargin || 0}%`}
              icon={Percent} color="text-info" loading={isBusy('financial')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard title="Costo Prod. Vendidos" value={formatCurrency(financialSummary?.totalCost || 0)}
              icon={TrendingDown} color="text-danger" loading={isBusy('financial')} />
            <KpiCard title="Inventario Valorizado" value={formatCurrency(financialSummary?.inventoryValue || 0)}
              icon={Wallet} color="text-info" loading={isBusy('financial')} />
            <KpiCard title="Ticket Promedio" value={formatCurrency(financialSummary?.avgTicket || 0)}
              icon={Receipt} color="text-info" loading={isBusy('financial')} />
            <KpiCard title="Ventas Realizadas" value={String(financialSummary?.totalSalesCount || 0)}
              icon={ShoppingCart} color="text-info" loading={isBusy('financial')} />
          </div>

          <div className="card-modern p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2 text-base">
              <BarChart3 size={18} className="text-primary" />
              Comparación Ingresos vs Costos
            </h3>
            <div className="flex items-center justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-2xl">
                <div className="text-center p-6 rounded-2xl" style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.2)' }}>
                  <DollarSign size={28} style={{ color: '#4CAF50' }} className="mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Ingresos</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#4CAF50' }}>{formatCurrency(financialSummary?.totalRevenue || 0)}</p>
                </div>
                <div className="text-center p-6 rounded-2xl" style={{ background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.2)' }}>
                  <TrendingDown size={28} style={{ color: '#EF5350' }} className="mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Costos</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#EF5350' }}>{formatCurrency(financialSummary?.totalCost || 0)}</p>
                </div>
                <div className="text-center p-6 rounded-2xl" style={{ background: 'rgba(91,155,213,0.1)', border: '1px solid rgba(91,155,213,0.2)' }}>
                  <PiggyBank size={28} className="mx-auto mb-2" style={{ color: (financialSummary?.netProfit || 0) >= 0 ? '#4CAF50' : '#EF5350' }} />
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Utilidad Neta</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: (financialSummary?.netProfit || 0) >= 0 ? '#4CAF50' : '#EF5350' }}>
                    {formatCurrency(financialSummary?.netProfit || 0)}
                  </p>
                </div>
              </div>
            </div>

            {financialSummary && (
              <div className="mt-6 p-5 rounded-2xl" style={{ background: 'rgba(91,155,213,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: financialSummary.netProfit >= 0 ? 'rgba(76,175,80,0.15)' : 'rgba(239,83,80,0.15)', color: financialSummary.netProfit >= 0 ? '#4CAF50' : '#EF5350' }}>
                      {financialSummary.netProfit >= 0
                        ? <TrendingUp size={20} />
                        : <TrendingDown size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">El negocio está generando</p>
                      <p className="text-xs text-muted-foreground">
                        {financialSummary.netProfit >= 0
                          ? `Utilidad positiva de ${formatCurrency(financialSummary.netProfit)} (${financialSummary.profitMargin}% de margen)`
                          : `Pérdida de ${formatCurrency(Math.abs(financialSummary.netProfit))} en el período`}
                      </p>
                    </div>
                  </div>
                  <div className="text-lg font-bold" style={{ color: financialSummary.netProfit >= 0 ? '#4CAF50' : '#EF5350' }}>
                    {financialSummary.netProfit >= 0 ? 'Rentable' : 'No rentable'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckCircle(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
