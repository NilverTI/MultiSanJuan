import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private buildDateWhere(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    return where;
  }

  async salesReport(params: { startDate?: string; endDate?: string; userId?: string }) {
    const { startDate, endDate, userId } = params;
    const where: any = { status: 'COMPLETED' };
    if (userId) where.userId = userId;
    Object.assign(where, this.buildDateWhere(startDate, endDate));

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true, purchasePrice: true, salePrice: true, category: true } } } },
        payments: true,
        user: { select: { id: true, firstName: true, lastName: true } },
        customer: { select: { id: true, firstName: true, lastName: true, email: true, dni: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((s, sale) => s + Number(sale.total), 0),
      totalDiscount: sales.reduce((s, sale) => s + Number(sale.discount), 0),
      totalIgv: sales.reduce((s, sale) => s + Number(sale.igv), 0),
      byPaymentMethod: {} as Record<string, number>,
      byUser: {} as Record<string, { count: number; total: number }>,
      totalCost: 0,
      netProfit: 0,
    };

    for (const sale of sales) {
      for (const payment of sale.payments) {
        summary.byPaymentMethod[payment.method] =
          (summary.byPaymentMethod[payment.method] || 0) + Number(payment.amount);
      }
      const userName = `${sale.user.firstName} ${sale.user.lastName}`;
      if (!summary.byUser[userName]) summary.byUser[userName] = { count: 0, total: 0 };
      summary.byUser[userName].count++;
      summary.byUser[userName].total += Number(sale.total);

      for (const item of sale.items) {
        if (item.product?.purchasePrice) {
          summary.totalCost += Number(item.product.purchasePrice) * item.quantity;
        }
      }
    }
    summary.netProfit = summary.totalRevenue - summary.totalCost;

    return { sales, summary };
  }

  async productsReport() {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: true,
        brand: true,
        _count: { select: { saleItems: true } },
      },
      orderBy: { saleItems: { _count: 'desc' } },
    });

    const totalInventoryValue = products.reduce(
      (sum, p) => sum + Number(p.purchasePrice || 0) * Math.max(p.stock, 0),
      0,
    );

    return {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.isActive).length,
      lowStock: products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length,
      outOfStock: products.filter((p) => p.stock === 0).length,
      inventoryValue: totalInventoryValue,
      products,
    };
  }

  async inventoryReport() {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      include: { category: true, brand: true },
      orderBy: { name: 'asc' },
    });

    const inventoryValue = products.reduce(
      (sum, p) => sum + Number(p.purchasePrice || 0) * Math.max(p.stock, 0),
      0,
    );

    const stockSummary = {
      totalProducts: products.length,
      totalStock: products.reduce((s, p) => s + Math.max(p.stock, 0), 0),
      inventoryValue,
      lowStock: products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length,
      outOfStock: products.filter((p) => p.stock === 0).length,
      overStock: products.filter((p) => p.maxStock && p.stock > p.maxStock).length,
      products,
    };

    const movements = await this.prisma.inventoryMovement.findMany({
      include: {
        product: { select: { id: true, name: true, sku: true } },
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const byType = movements.reduce(
      (acc, m) => {
        acc[m.type] = (acc[m.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { ...stockSummary, movements, movementByType: byType, totalMovements: movements.length };
  }

  async financialReport(params: { startDate?: string; endDate?: string }) {
    const dateFilter = this.buildDateWhere(params.startDate, params.endDate);
    const saleWhere = { status: 'COMPLETED', ...dateFilter };

    const sales = await this.prisma.sale.findMany({
      where: saleWhere,
      include: {
        items: { include: { product: { select: { purchasePrice: true } } } },
        payments: true,
      },
    });

    const totalRevenue = sales.reduce((s, sale) => s + Number(sale.total), 0);
    let totalCost = 0;

    for (const sale of sales) {
      for (const item of sale.items) {
        if (item.product?.purchasePrice) {
          totalCost += Number(item.product.purchasePrice) * item.quantity;
        }
      }
    }

    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, stock: true, purchasePrice: true, salePrice: true },
    });
    const inventoryValue = products.reduce(
      (sum, p) => sum + Number(p.purchasePrice || 0) * Math.max(p.stock, 0),
      0,
    );

    const totalSalesCount = sales.length;
    const avgTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    return {
      totalRevenue,
      totalCost,
      netProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      inventoryValue,
      totalSalesCount,
      avgTicket: Math.round(avgTicket * 100) / 100,
    };
  }

  async customerReport(params: { startDate?: string; endDate?: string }) {
    const dateFilter = this.buildDateWhere(params.startDate, params.endDate);
    const sales = await this.prisma.sale.findMany({
      where: { status: 'COMPLETED', ...dateFilter },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, dni: true, phone: true } },
        items: { select: { quantity: true, productId: true } },
      },
    });

    const customerMap = new Map<string, {
      firstName: string; lastName: string; email: string | null; dni: string | null; phone: string | null;
      salesCount: number; totalSpent: number; totalProducts: number; lastPurchase: string;
    }>();

    for (const sale of sales) {
      if (!sale.customer) continue;
      const c = sale.customer;
      const key = c.id;
      const existing = customerMap.get(key) || {
        firstName: c.firstName,
        lastName: c.lastName || '',
        email: c.email ?? null,
        dni: c.dni ?? null,
        phone: c.phone ?? null,
        salesCount: 0,
        totalSpent: 0,
        totalProducts: 0,
        lastPurchase: sale.createdAt.toISOString(),
      };
      existing.salesCount++;
      existing.totalSpent += Number(sale.total);
      existing.totalProducts += sale.items.reduce((s, i) => s + i.quantity, 0);
      if (new Date(sale.createdAt) > new Date(existing.lastPurchase)) {
        existing.lastPurchase = sale.createdAt.toISOString();
      }
      customerMap.set(key, existing);
    }

    const customers = Array.from(customerMap.entries()).map(([id, v]) => ({ id, ...v }));
    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    const mostFrequent = [...customers].sort((a, b) => b.salesCount - a.salesCount).slice(0, 20);
    const topBySpent = customers.slice(0, 20);

    return {
      totalCustomers: customers.length,
      topBySpent: topBySpent.map((c, i) => ({ rank: i + 1, ...c })),
      topByFrequency: mostFrequent.map((c, i) => ({ rank: i + 1, ...c })),
      customers,
    };
  }

  async stockAlerts() {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      include: { category: true, brand: true },
      orderBy: { stock: 'asc' },
    });

    const noStock = products.filter((p) => p.stock === 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    const overStock = products.filter((p) => p.maxStock && p.stock > p.maxStock);

    return {
      noStock: noStock.map((p) => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock, minStock: p.minStock })),
      lowStock: lowStock.map((p) => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock, minStock: p.minStock })),
      overStock: overStock.map((p) => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock, maxStock: p.maxStock })),
      noStockCount: noStock.length,
      lowStockCount: lowStock.length,
      overStockCount: overStock.length,
    };
  }
}
