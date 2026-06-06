import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createMovement(dto: CreateMovementDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new BadRequestException('Producto no encontrado');

    const stockBefore = product.stock;
    let stockAfter = stockBefore;

    if (['ENTRY', 'RETURN'].includes(dto.type)) {
      stockAfter = stockBefore + dto.quantity;
    } else if (['EXIT', 'SALE', 'LOSS', 'EXPIRY'].includes(dto.type)) {
      if (stockBefore < dto.quantity) throw new BadRequestException('Stock insuficiente');
      stockAfter = stockBefore - dto.quantity;
    } else if (dto.type === 'ADJUSTMENT' || dto.type === 'MANUAL_CORRECTION') {
      stockAfter = dto.quantity;
    }

    await this.prisma.product.update({
      where: { id: dto.productId },
      data: { stock: stockAfter },
    });

    const movement = await this.prisma.inventoryMovement.create({
      data: {
        productId: dto.productId,
        type: dto.type,
        quantity: dto.quantity,
        stockBefore,
        stockAfter,
        notes: dto.notes,
        reference: dto.reference,
        userId,
      },
      include: { product: { select: { id: true, name: true, sku: true } } },
    });

    await this.auditService.log({
      userId,
      action: 'INVENTORY_MOVEMENT',
      module: 'INVENTORY',
      description: `Movimiento de inventario: ${dto.type} - ${product.name} (${dto.quantity})`,
      oldValue: JSON.stringify({ stock: stockBefore }),
      newValue: JSON.stringify({ stock: stockAfter }),
      referenceId: movement.id,
    });

    return movement;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    productId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 50, productId, type, startDate, endDate } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
