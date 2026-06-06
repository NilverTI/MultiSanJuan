import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(filters?: DashboardFilterDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startFilter = filters?.startDate ? new Date(filters.startDate + 'T00:00:00.000Z') : today;
    const endFilter = filters?.endDate
      ? new Date(filters.endDate + 'T23:59:59.999Z')
      : tomorrow;

    const saleWhere: any = {
      status: 'COMPLETED',
      createdAt: { gte: startFilter, lt: endFilter },
    };
    if (filters?.customerId) saleWhere.customerId = filters.customerId;
    if (filters?.productId) {
      saleWhere.items = { some: { productId: filters.productId } };
    }

    const [
      todaySales,
      totalSalesCount,
      totalProducts,
      allActiveProducts,
      activeCashRegister,
      salesData,
      paymentMethods,
      categorySales,
    ] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: today, lt: tomorrow },
        },
        include: { payments: true, items: true },
      }),
      this.prisma.sale.count({ where: saleWhere }),
      this.prisma.product.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.product.findMany({
        where: { isActive: true, deletedAt: null },
        select: { id: true, stock: true, minStock: true, purchasePrice: true, salePrice: true, name: true },
      }),
      this.prisma.cashRegister.findFirst({ where: { status: 'OPEN' } }),
      this.prisma.sale.findMany({
        where: saleWhere,
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true, purchasePrice: true, salePrice: true, categoryId: true } } } },
          payments: true,
          customer: { select: { id: true, firstName: true, lastName: true, dni: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.salePayment.groupBy({
        by: ['method'],
        _sum: { amount: true },
        where: { sale: { createdAt: { gte: startFilter, lt: endFilter }, status: 'COMPLETED' } },
      }),
      filters?.categoryId
        ? this.prisma.saleItem.findMany({
            where: {
              sale: { createdAt: { gte: startFilter, lt: endFilter }, status: 'COMPLETED' },
              product: { categoryId: filters.categoryId },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    const lowStockProducts = allActiveProducts.filter((p) => p.stock <= p.minStock).length;
    const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
    const todayCount = todaySales.length;

    const productSalesMap = new Map<string, { name: string; sku: string; qty: number; revenue: number; cost: number }>();
    const customerMap = new Map<string, { firstName: string; lastName: string; email: string | null; dni: string | null; salesCount: number; totalSpent: number }>();
    const dailyMap = new Map<string, { date: string; revenue: number; count: number; cost: number }>();

    for (const sale of salesData) {
      const dayKey = sale.createdAt.toISOString().slice(0, 10);
      const day = dailyMap.get(dayKey) || { date: dayKey, revenue: 0, count: 0, cost: 0 };
      day.revenue += Number(sale.total);
      day.count += 1;
      dailyMap.set(dayKey, day);

      if (sale.customer) {
        const c = sale.customer;
        const key = c.id;
        const existing = customerMap.get(key) || ({
          firstName: c.firstName,
          lastName: c.lastName || '',
          email: c.email ?? null,
          dni: c.dni ?? null,
          salesCount: 0,
          totalSpent: 0,
        } as { firstName: string; lastName: string; email: string | null; dni: string | null; salesCount: number; totalSpent: number });
        existing.salesCount += 1;
        existing.totalSpent += Number(sale.total);
        customerMap.set(key, existing);
      }

      for (const item of sale.items) {
        const pid = item.productId;
        const existing = productSalesMap.get(pid) || {
          name: item.product?.name || item.productName,
          sku: item.product?.sku || '',
          qty: 0,
          revenue: 0,
          cost: 0,
        };
        existing.qty += item.quantity;
        existing.revenue += Number(item.total);
        const pp = item.product?.purchasePrice;
        if (pp) {
          existing.cost += Number(pp) * item.quantity;
        }
        productSalesMap.set(pid, existing);
      }
    }

    const products = Array.from(productSalesMap.entries()).map(([id, v]) => ({ id, ...v }));
    products.sort((a, b) => b.qty - a.qty);

    const productsByRevenue = [...products].sort((a, b) => b.revenue - a.revenue);
    const mostSold = products.length > 0 ? products[0] : null;
    const leastSold = products.length > 1 ? products[products.length - 1] : null;

    const customers = Array.from(customerMap.entries()).map(([id, v]) => ({ id, ...v }));
    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    const salesTimeline = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    const totalRevenue = salesData.reduce((sum, s) => sum + Number(s.total), 0);
    const totalCost = [...productSalesMap.values()].reduce((sum, p) => sum + p.cost, 0);
    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const totalProductsSold = [...productSalesMap.values()].reduce((sum, p) => sum + p.qty, 0);
    const uniqueCustomers = customerMap.size;

    const weekMap = new Map<string, { week: string; revenue: number; count: number }>();
    const monthMap = new Map<string, { month: string; revenue: number; count: number }>();
    for (const sale of salesData) {
      const d = sale.createdAt;
      const weekKey = `${d.getFullYear()}-W${String(Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)).padStart(2, '0')}`;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const w = weekMap.get(weekKey) || { week: weekKey, revenue: 0, count: 0 };
      w.revenue += Number(sale.total);
      w.count += 1;
      weekMap.set(weekKey, w);

      const m = monthMap.get(monthKey) || { month: monthKey, revenue: 0, count: 0 };
      m.revenue += Number(sale.total);
      m.count += 1;
      monthMap.set(monthKey, m);
    }

    const bestDay = salesTimeline.length > 0
      ? salesTimeline.reduce((a, b) => (a.revenue > b.revenue ? a : b))
      : null;
    const bestWeek = weekMap.size > 0
      ? Array.from(weekMap.values()).reduce((a, b) => (a.revenue > b.revenue ? a : b))
      : null;
    const bestMonth = monthMap.size > 0
      ? Array.from(monthMap.values()).reduce((a, b) => (a.revenue > b.revenue ? a : b))
      : null;

    const avgTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    return {
      todayRevenue,
      todaySalesCount: todayCount,
      totalSales: totalSalesCount,
      totalProducts,
      lowStockProducts,
      cashRegisterOpen: !!activeCashRegister,
      openRegister: activeCashRegister,
      topProducts: products.slice(0, 10).map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        totalSold: p.qty,
      })),
      salesByPaymentMethod: paymentMethods.map((p) => ({
        method: p.method,
        total: p._sum.amount,
      })),
      financial: {
        totalRevenue,
        totalCost,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        totalProductsSold,
        uniqueCustomers,
        avgTicket: Math.round(avgTicket * 100) / 100,
      },
      productsRanking: {
        byQuantity: products.slice(0, 20).map((p, i) => ({ rank: i + 1, ...p })),
        byRevenue: productsByRevenue.slice(0, 20).map((p, i) => ({ rank: i + 1, ...p })),
        mostSold: mostSold ? { id: mostSold.id, name: mostSold.name, qty: mostSold.qty, revenue: mostSold.revenue } : null,
        leastSold: leastSold ? { id: leastSold.id, name: leastSold.name, qty: leastSold.qty, revenue: leastSold.revenue } : null,
      },
      customersRanking: customers.slice(0, 20).map((c, i) => ({ rank: i + 1, ...c })),
      salesTimeline,
      bestDay,
      bestWeek,
      bestMonth,
    };
  }
}
