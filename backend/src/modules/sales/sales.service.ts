import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateSaleDto, userId: string) {
    const receiptNumber = await this.generateReceiptNumber();

    const sale = await this.prisma.$transaction(async (tx) => {
      const productNameMap: Record<string, string> = {};
      for (const item of dto.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new BadRequestException(`Producto ${item.productId} no encontrado`);
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
          );
        }
        productNameMap[item.productId] = product.name;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        const stockAfter = product.stock - item.quantity;
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            presentationId: item.presentationId,
            type: 'SALE',
            quantity: item.quantity,
            stockBefore: product.stock,
            stockAfter,
            userId,
          },
        });
      }

      return tx.sale.create({
        data: {
          receiptNumber,
          subtotal: dto.subtotal,
          discount: dto.discount || 0,
          igv: dto.igv,
          total: dto.total,
          userId,
          customerId: dto.customerId,
          cashRegisterId: dto.cashRegisterId,
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              presentationId: item.presentationId,
              productName: productNameMap[item.productId] || '',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              subtotal: item.unitPrice * item.quantity,
              total: item.unitPrice * item.quantity - (item.discount || 0),
            })),
          },
          payments: {
            create: dto.payments.map((p) => ({
              method: p.method,
              amount: p.amount,
              reference: p.reference,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          payments: true,
          customer: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });

    await this.auditService.log({
      userId,
      action: 'SALE_CREATED',
      module: 'SALES',
      description: `Venta creada: ${receiptNumber} - Total: S/ ${dto.total}`,
      referenceId: sale.id,
    });

    return sale;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    userId?: string;
    customerId?: string;
    status?: string;
  }) {
    const { page = 1, limit = 50, startDate, endDate, userId, customerId, status } = params;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          payments: true,
          customer: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        user: { select: { id: true, firstName: true, lastName: true, username: true } },
      },
    });
  }

  async cancel(id: string, userId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) throw new BadRequestException('Venta no encontrada');
    if (sale.status === 'CANCELLED') throw new BadRequestException('La venta ya está anulada');

    await this.prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: 'CANCELLATION',
              quantity: item.quantity,
              stockBefore: product.stock,
              stockAfter: product.stock + item.quantity,
              userId,
              reference: `Anulación venta ${sale.receiptNumber}`,
            },
          });
        }
      }

      await tx.sale.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    });

    await this.auditService.log({
      userId,
      action: 'SALE_CANCELLED',
      module: 'SALES',
      description: `Venta anulada: ${sale.receiptNumber}`,
      referenceId: id,
    });
  }

  private async generateReceiptNumber(): Promise<string> {
    const date = new Date();
    const prefix = `MSJ-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-`;
    const lastSale = await this.prisma.sale.findFirst({
      where: { receiptNumber: { startsWith: prefix } },
      orderBy: { receiptNumber: 'desc' },
    });

    const nextNumber = lastSale ? parseInt(lastSale.receiptNumber.split('-')[2]) + 1 : 1;
    return `${prefix}${String(nextNumber).padStart(6, '0')}`;
  }
}
