'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { dashboardApi, productsApi, customersApi, categoriesApi } from '@/services/api';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle, Store,
  Calendar, Filter, X, RefreshCw, Users, Wallet, PiggyBank, Target,
  BarChart3, LineChart, PieChart, Crown, Trophy, Percent,
  TrendingDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Line, LineChart as ReLineChart, PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import type { DashboardStats } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { KpiCard } from '@/components/kpi-card';
import { SkeletonLine } from '@/components/skeleton-line';
import { getDateRange } from '@/lib/date-utils';
import type { Period, TimelineView } from '@/lib/date-utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [timelineView, setTimelineView] = useState<TimelineView>('daily');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (period === 'custom' && customStart) {
        params.startDate = customStart;
        if (customEnd) params.endDate = customEnd;
      } else {
        const range = getDateRange(period);
        if (range.startDate) params.startDate = range.startDate;
        if (range.endDate) params.endDate = range.endDate;
      }
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedProduct) params.productId = selectedProduct;
      if (selectedCustomer) params.customerId = selectedCustomer;
      const data = await dashboardApi.getStats(params);
      setStats(data);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd, selectedCategory, selectedProduct, selectedCustomer]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {});
  }, []);

  const timelineData = useMemo(() => {
    if (!stats?.salesTimeline) return [];
    if (timelineView === 'daily') return stats.salesTimeline;
    if (timelineView === 'weekly') {
      const map = new Map<string, { week: string; revenue: number; count: number }>();
      for (const d of stats.salesTimeline) {
        const date = new Date(d.date);
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const key = weekStart.toISOString().slice(0, 10);
        const existing = map.get(key) || { week: `Sem ${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`, revenue: 0, count: 0 };
        existing.revenue += d.revenue;
        existing.count += d.count;
        map.set(key, existing);
      }
      return Array.from(map.values());
    }
    if (timelineView === 'monthly') {
      const map = new Map<string, { month: string; revenue: number; count: number }>();
      for (const d of stats.salesTimeline) {
        const key = d.date.slice(0, 7);
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthIdx = parseInt(key.split('-')[1]) - 1;
        const existing = map.get(key) || { month: monthNames[monthIdx] || key, revenue: 0, count: 0 };
        existing.revenue += d.revenue;
        existing.count += d.count;
        map.set(key, existing);
      }
      return Array.from(map.values());
    }
    return [];
  }, [stats, timelineView]);

  const paymentChartData = useMemo(() => {
    if (!stats?.salesByPaymentMethod) return [];
    const labels: Record<string, string> = { CASH: 'Efectivo', YAPE: 'Yape', PLIN: 'Plin', TRANSFER: 'Transferencia', CARD: 'Tarjeta', MIXED: 'Mixto' };
    return stats.salesByPaymentMethod.map(p => ({
      name: labels[p.method] || p.method,
      value: p.total,
      color: p.method === 'CASH' ? '#81C784'
        : p.method === 'YAPE' ? '#90CAF9' : p.method === 'PLIN' ? '#90CAF9'
        : p.method === 'TRANSFER' ? '#80CBC4' : p.method === 'CARD' ? '#FFB74D' : '#EF9A9A'
    }));
  }, [stats]);

  const productChartData = useMemo(() => {
    if (!stats?.productsRanking?.byQuantity) return [];
    return stats.productsRanking.byQuantity.slice(0, 10).map(p => ({
      name: p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name,
      Cantidad: p.qty,
      Ingreso: p.revenue,
    }));
  }, [stats]);

  const customerChartData = useMemo(() => {
    if (!stats?.customersRanking) return [];
    return stats.customersRanking.slice(0, 10).map(c => ({
      name: `${c.firstName} ${c.lastName}`.length > 16 ? `${c.firstName} ${c.lastName}`.slice(0, 14) + '…' : `${c.firstName} ${c.lastName}`,
      Gastos: c.totalSpent,
      Compras: c.salesCount,
    }));
  }, [stats]);

  const resetFilters = useCallback(() => {
    setSelectedCategory('');
    setSelectedProduct('');
    setSelectedCustomer('');
    setCustomStart('');
    setCustomEnd('');
    setPeriod('today');
  }, []);

  return (
    <div className="page-container dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel Principal</h1>
          <p className="page-subtitle">
            Bienvenido, {user?.firstName} &mdash; {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-[#1E1E1E] rounded-2xl p-1 border border-[rgba(255,255,255,0.08)]">
            {(['today', 'week', 'month'] as Period[]).map(p => (
              <button key={p} onClick={() => { setPeriod(p); setCustomStart(''); setCustomEnd(''); }}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200',
                  period === p ? 'bg-[#90CAF9] text-white font-bold shadow-[0_4px_14px_rgba(144,202,249,0.35)]' : 'text-[#BDBDBD] hover:text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.06)]')}>
                {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
            <button onClick={() => setPeriod('custom')}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200',
                period === 'custom' ? 'bg-[#90CAF9] text-white font-bold shadow-[0_4px_14px_rgba(144,202,249,0.35)]' : 'text-[#BDBDBD] hover:text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.06)]')}>
              <Calendar size={12} className="inline mr-1" />
              Personalizado
            </button>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn('btn-ghost btn-sm gap-1.5', showFilters && 'bg-[rgba(144,202,249,0.18)] text-[#90CAF9]')}>
            <Filter size={14} />
            Filtros
          </button>
          <button onClick={fetchStats} className="btn-ghost btn-sm" title="Actualizar">
            <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {period === 'custom' && (
        <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl" style={{ background: 'rgba(144,202,249,0.08)', border: '1px solid rgba(144,202,249,0.15)' }}>
          <Calendar size={16} style={{ color: '#90CAF9' }} />
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
            className="input-field !w-auto !h-9 text-sm" />
          <span className="text-muted-foreground text-xs">a</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
            className="input-field !w-auto !h-9 text-sm" />
          <button onClick={fetchStats} className="btn-primary btn-sm">Aplicar</button>
        </div>
      )}

      {showFilters && (
        <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl border flex-wrap" style={{ background: 'rgba(144,202,249,0.08)', border: '1px solid rgba(144,202,249,0.15)' }}>
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Filter size={12} /> Filtros:
          </span>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            className="input-field !w-auto !h-9 text-sm min-w-[140px]">
            <option value="">Todas las categorías</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="ID Producto" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
            className="input-field !w-auto !h-9 text-sm min-w-[120px]" />
          <input placeholder="ID Cliente" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}
            className="input-field !w-auto !h-9 text-sm min-w-[120px]" />
          <button onClick={resetFilters} className="btn-ghost btn-sm text-muted-foreground gap-1">
            <X size={12} /> Limpiar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Ingresos del Día" value={formatCurrency(stats?.todayRevenue || 0)}
          subtitle={`${stats?.todaySalesCount || 0} ventas hoy`} icon={TrendingUp} color="text-success" loading={loading} />
        <KpiCard title="Ventas Totales" value={String(stats?.totalSales || 0)}
          subtitle="Histórico del período" icon={ShoppingCart} color="text-info" loading={loading} />
        <KpiCard title="Productos" value={String(stats?.totalProducts || 0)}
          subtitle="En inventario" icon={Package} color="text-info" loading={loading} />
        <KpiCard title="Stock Bajo" value={String(stats?.lowStockProducts || 0)}
          subtitle="Productos por reabastecer" icon={AlertTriangle} color="text-warning" loading={loading} />
      </div>

      {stats?.financial && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <KpiCard title="Total Ingresado" value={formatCurrency(stats.financial.totalRevenue)}
            icon={Wallet} color="text-success" loading={loading} />
          <KpiCard title="Total Invertido" value={formatCurrency(stats.financial.totalCost)}
            icon={TrendingDown} color="text-warning" loading={loading} />
          <KpiCard title="Ganancia Neta" value={formatCurrency(stats.financial.netProfit)}
            subtitle={stats.financial.netProfit >= 0 ? 'Utilidad positiva' : 'Pérdida'}
            trend={stats.financial.netProfit >= 0 ? 'up' : 'down'}
            icon={PiggyBank} color={stats.financial.netProfit >= 0 ? 'text-success' : 'text-danger'} loading={loading} />
          <KpiCard title="Margen" value={`${stats.financial.profitMargin}%`}
            subtitle="Margen de ganancia" icon={Percent} color="text-info" loading={loading} />
          <KpiCard title="Prod. Vendidos" value={String(stats.financial.totalProductsSold)}
            icon={Package} color="text-info" loading={loading} />
          <KpiCard title="Clientes" value={String(stats.financial.uniqueCustomers)}
            subtitle={`Ticket prom: ${formatCurrency(stats.financial.avgTicket)}`}
            icon={Users} color="text-info" loading={loading} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-modern p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
            <LineChart size={20} className="text-primary" />
            Evolución de Ventas
          </h3>
          <div className="flex gap-1 mb-4">
            {(['daily', 'weekly', 'monthly'] as TimelineView[]).map(v => (
              <button key={v} onClick={() => setTimelineView(v)}
                className={cn('px-3 py-1 text-xs font-medium rounded-lg transition-all',
                  timelineView === v ? 'bg-[rgba(144,202,249,0.18)] text-[#90CAF9]' : 'text-[#BDBDBD] hover:text-[#F5F5F5]')}>
                {v === 'daily' ? 'Diario' : v === 'weekly' ? 'Semanal' : 'Mensual'}
              </button>
            ))}
          </div>
          {loading ? (
            <SkeletonLine className="h-[250px] w-full" />
          ) : timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <ReLineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey={timelineView === 'weekly' ? 'week' : timelineView === 'monthly' ? 'month' : 'date'}
                  tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}
                  formatter={(value: any) => formatCurrency(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#90CAF9" strokeWidth={2.5} dot={{ r: 3, fill: '#90CAF9' }} activeDot={{ r: 5, fill: '#90CAF9' }} />
              </ReLineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">Sin datos de ventas en este período</div>
          )}
        </div>

        <div className="card-modern p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
            <PieChart size={20} className="text-primary" />
            Ventas por Método de Pago
          </h3>
          {loading ? (
            <SkeletonLine className="h-[250px] w-full" />
          ) : paymentChartData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <RePieChart>
                  <Pie data={paymentChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    {paymentChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}
                    formatter={(value: any) => formatCurrency(value)} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="space-y-2 min-w-[140px]">
                {paymentChartData.map(p => (
                  <div key={p.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-muted-foreground">{p.name}</span>
                    <span className="font-medium ml-auto">{formatCurrency(p.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">Sin ventas registradas</div>
          )}
        </div>
      </div>

      {stats?.productsRanking && (
        <div className="mt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
            <BarChart3 size={20} className="text-primary" />
            Productos más vendidos
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-modern p-6">
              {stats.productsRanking.mostSold && (
                <div className="flex items-center gap-4 p-4 mb-4 rounded-2xl" style={{ background: 'rgba(255,183,77,0.1)', border: '1px solid rgba(255,183,77,0.2)' }}>
                  <Trophy size={28} style={{ color: '#FFB74D' }} />
                  <div>
                    <p className="text-xs text-muted-foreground">Más vendido</p>
                    <p className="font-bold text-base">{stats.productsRanking.mostSold.name}</p>
                    <p className="text-xs text-muted-foreground">{stats.productsRanking.mostSold.qty} uds &middot; {formatCurrency(stats.productsRanking.mostSold.revenue)}</p>
                  </div>
                </div>
              )}
              {loading ? (
                <SkeletonLine className="h-[200px] w-full" />
              ) : productChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={productChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}
                      formatter={(value: any) => formatCurrency(value)} />
                    <Bar dataKey="Ingreso" fill="#81C784" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">Sin datos de productos</div>
              )}
            </div>

            <div className="card-modern">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => <SkeletonLine key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {stats.productsRanking.byQuantity.slice(0, 8).map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                          i === 0 ? 'bg-[#C69249]/10 text-warning' :
                          i === 1 ? 'bg-[#8D8D8D]/10 text-[#8D8D8D]' :
                          i === 2 ? 'bg-[#C69249]/10 text-warning' :
                          'bg-[#303030] text-muted-foreground')}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{p.qty} uds</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(p.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {stats?.customersRanking && stats.customersRanking.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
            <Crown size={20} className="text-primary" />
            Clientes principales
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-modern p-6">
              {loading ? (
                <SkeletonLine className="h-[250px] w-full" />
              ) : customerChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={customerChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}
                      formatter={(value: any) => formatCurrency(value)} />
                    <Bar dataKey="Gastos" fill="#90CAF9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">Sin datos de clientes</div>
              )}
            </div>

            <div className="card-modern">
              <div className="divide-y divide-border/50">
                {stats.customersRanking.slice(0, 8).map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                        i === 0 ? 'bg-[#4D8B74]/10 text-success' :
                        i === 1 ? 'bg-[#8D8D8D]/10 text-[#8D8D8D]' :
                        i === 2 ? 'bg-[#4D8B74]/10 text-success' :
                        'bg-[#303030] text-muted-foreground')}>
                        {c.firstName[0]}{c.lastName?.[0] || ''}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-muted-foreground">{c.salesCount} compras {c.email ? `· ${c.email}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(c.totalSpent)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {stats?.bestDay && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-modern p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(129,199,132,0.15)', color: '#81C784' }}>
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Mejor Día</p>
              <p className="font-bold">{stats.bestDay.date}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(stats.bestDay.revenue)} · {stats.bestDay.count} ventas</p>
            </div>
          </div>
          {stats.bestWeek && (
            <div className="card-modern p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(144,202,249,0.15)', color: '#90CAF9' }}>
                <BarChart3 size={24} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Mejor Semana</p>
                <p className="font-bold">{stats.bestWeek.week}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.bestWeek.revenue)} · {stats.bestWeek.count} ventas</p>
              </div>
            </div>
          )}
          {stats.bestMonth && (
            <div className="card-modern p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(144,202,249,0.15)', color: '#90CAF9' }}>
                <Target size={24} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Mejor Mes</p>
                <p className="font-bold">{stats.bestMonth.month}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.bestMonth.revenue)} · {stats.bestMonth.count} ventas</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <div className="card-modern p-6">
          <h3 className="font-semibold mb-5 flex items-center gap-2 text-lg">
            <Store size={20} className="text-primary" />
            Estado de Caja
          </h3>
          {loading ? (
            <SkeletonLine className="h-16 w-full" />
          ) : stats?.cashRegisterOpen ? (
            <div className="flex items-center gap-4 p-5 rounded-2xl" style={{ background: 'rgba(129,199,132,0.1)', border: '1px solid rgba(129,199,132,0.25)' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: '#81C784' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#81C784' }}>Caja Abierta</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Abierta por {stats.openRegister?.openedBy?.firstName} {stats.openRegister?.openedBy?.lastName}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-5 rounded-2xl" style={{ background: 'rgba(255,183,77,0.1)', border: '1px solid rgba(255,183,77,0.25)' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: '#FFB74D' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#FFB74D' }}>Caja Cerrada</p>
                <p className="text-xs text-muted-foreground mt-0.5">Abrir caja para comenzar a vender</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
