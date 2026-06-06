import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateQuoteDto, userId: string) {
    const quoteNumber = await this.generateQuoteNumber();
    const quote = await this.prisma.quote.create({
      data: {
        quoteNumber,
        customerId: dto.customerId,
        subtotal: dto.subtotal,
        discount: dto.discount || 0,
        total: dto.total,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
        userId,
        items: dto.items
          ? {
              create: dto.items.map((item: any) => ({
                productId: item.productId,
                productName: item.productName || '',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount || 0,
                total: item.total || item.unitPrice * item.quantity,
              })),
            }
          : undefined,
      },
      include: { items: true, customer: true },
    });

    await this.auditService.log({
      userId,
      action: 'QUOTE_CREATED',
      module: 'QUOTES',
      description: `Cotización creada: ${quoteNumber}`,
      referenceId: quote.id,
    });

    return quote;
  }

  async findAll(params: { page?: number; limit?: number; status?: string; customerId?: string }) {
    const { page = 1, limit = 50, status, customerId } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [data, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        include: {
          items: true,
          customer: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.quote.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, customer: true, user: true },
    });
    if (!quote) throw new NotFoundException('Cotización no encontrada');
    return quote;
  }

  async updateStatus(id: string, status: string) {
    await this.findById(id);
    return this.prisma.quote.update({ where: { id }, data: { status: status as any } });
  }

  private async generateQuoteNumber() {
    const prefix = `COT-${new Date().getFullYear()}-`;
    const last = await this.prisma.quote.findFirst({
      where: { quoteNumber: { startsWith: prefix } },
      orderBy: { quoteNumber: 'desc' },
    });
    return `${prefix}${last ? parseInt(last.quoteNumber.split('-')[2]) + 1 : 1}`.padEnd(15, '0');
  }
}
