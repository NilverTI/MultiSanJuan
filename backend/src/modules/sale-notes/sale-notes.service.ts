import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSaleNoteDto } from './dto/sale-note.dto';

@Injectable()
export class SaleNotesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateSaleNoteDto, userId: string) {
    const noteNumber = `NV-${Date.now()}`;
    const note = await this.prisma.saleNote.create({
      data: {
        noteNumber,
        customerId: dto.customerId,
        subtotal: dto.subtotal ?? 0,
        discount: dto.discount ?? 0,
        total: dto.total ?? 0,
        notes: dto.notes,
        userId,
        items: dto.items
          ? {
              create: dto.items.map((item) => ({
                productId: item.productId ?? '',
                productName: item.productName ?? '',
                quantity: item.quantity ?? 1,
                unitPrice: item.unitPrice ?? 0,
                discount: item.discount ?? 0,
                total: item.total ?? (item.unitPrice ?? 0) * (item.quantity ?? 1),
              })),
            }
          : undefined,
      },
      include: { items: true, customer: true },
    });

    await this.auditService.log({
      userId,
      action: 'SALE_NOTE_CREATED',
      module: 'SALE_NOTES',
      description: `Nota de venta creada: ${noteNumber}`,
      referenceId: note.id,
    });

    return note;
  }

  async findAll(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 50, status } = params;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.saleNote.findMany({
        where,
        include: {
          items: true,
          customer: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.saleNote.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const note = await this.prisma.saleNote.findUnique({
      where: { id },
      include: { items: true, customer: true },
    });
    if (!note) throw new NotFoundException('Nota de venta no encontrada');
    return note;
  }

  async updateStatus(id: string, status: 'CONVERTED' | 'CANCELLED') {
    await this.findById(id);
    return this.prisma.saleNote.update({ where: { id }, data: { status } });
  }
}
