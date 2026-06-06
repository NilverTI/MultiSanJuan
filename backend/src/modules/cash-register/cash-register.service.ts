import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CashRegisterService {
  private readonly logger = new Logger(CashRegisterService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async open(dto: OpenCashRegisterDto, userId: string) {
    const openRegister = await this.prisma.cashRegister.findFirst({
      where: { status: 'OPEN' },
    });
    if (openRegister) throw new BadRequestException('Ya hay una caja abierta. Ciérrela primero.');

    const register = await this.prisma.cashRegister.create({
      data: {
        initialAmount: dto.initialAmount,
        openedById: userId,
        observations: dto.observations,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CASH_OPEN',
      module: 'CASH_REGISTER',
      description: `Caja abierta con S/ ${dto.initialAmount}`,
      referenceId: register.id,
    });

    return register;
  }

  async close(dto: CloseCashRegisterDto, userId: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { status: 'OPEN' },
      include: {
        sales: {
          where: { status: 'COMPLETED' },
          include: { payments: true },
        },
      },
    });

    if (!register) throw new BadRequestException('No hay caja abierta');

    const totalCash = register.sales
      .flatMap((s) => s.payments)
      .filter((p) => p.method === 'CASH')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalYape = register.sales
      .flatMap((s) => s.payments)
      .filter((p) => p.method === 'YAPE')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPlin = register.sales
      .flatMap((s) => s.payments)
      .filter((p) => p.method === 'PLIN')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalTransfer = register.sales
      .flatMap((s) => s.payments)
      .filter((p) => p.method === 'TRANSFER')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalCard = register.sales
      .flatMap((s) => s.payments)
      .filter((p) => p.method === 'CARD')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const expectedCash = register.initialAmount.toNumber() + totalCash;
    const totalSales = register.sales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalPayments = totalCash + totalYape + totalPlin + totalTransfer + totalCard;

    const closed = await this.prisma.cashRegister.update({
      where: { id: register.id },
      data: {
        status: 'CLOSED',
        closedById: userId,
        closedAt: new Date(),
        expectedCash,
        expectedYape: totalYape,
        expectedPlin: totalPlin,
        expectedTransfer: totalTransfer,
        expectedCard: totalCard,
        expectedTotal: totalPayments + register.initialAmount.toNumber(),
        countedCash: dto.countedCash,
        countedYape: dto.countedYape,
        countedPlin: dto.countedPlin,
        countedTransfer: dto.countedTransfer,
        countedCard: dto.countedCard,
        countedTotal:
          dto.countedCash +
          dto.countedYape +
          dto.countedPlin +
          dto.countedTransfer +
          dto.countedCard,
        difference:
          dto.countedCash +
          dto.countedYape +
          dto.countedPlin +
          dto.countedTransfer +
          dto.countedCard -
          (totalPayments + register.initialAmount.toNumber()),
        observations: dto.observations,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CASH_CLOSE',
      module: 'CASH_REGISTER',
      description: `Caja cerrada. Diferencia: S/ ${closed.difference}`,
      referenceId: register.id,
    });

    return closed;
  }

  async getCurrentStatus() {
    const register = await this.prisma.cashRegister.findFirst({
      where: { status: 'OPEN' },
      include: {
        openedBy: { select: { id: true, firstName: true, lastName: true } },
        sales: {
          where: { status: 'COMPLETED' },
          include: { payments: true },
        },
      },
    });

    if (!register) return { status: 'CLOSED', message: 'No hay caja abierta' };

    const totals = {
      totalSales: register.sales.length,
      totalAmount: register.sales.reduce((sum, s) => sum + Number(s.total), 0),
      byMethod: {
        CASH: register.sales
          .flatMap((s) => s.payments)
          .filter((p) => p.method === 'CASH')
          .reduce((sum, p) => sum + Number(p.amount), 0),
        YAPE: register.sales
          .flatMap((s) => s.payments)
          .filter((p) => p.method === 'YAPE')
          .reduce((sum, p) => sum + Number(p.amount), 0),
        PLIN: register.sales
          .flatMap((s) => s.payments)
          .filter((p) => p.method === 'PLIN')
          .reduce((sum, p) => sum + Number(p.amount), 0),
        TRANSFER: register.sales
          .flatMap((s) => s.payments)
          .filter((p) => p.method === 'TRANSFER')
          .reduce((sum, p) => sum + Number(p.amount), 0),
        CARD: register.sales
          .flatMap((s) => s.payments)
          .filter((p) => p.method === 'CARD')
          .reduce((sum, p) => sum + Number(p.amount), 0),
      },
    };

    return { register, totals };
  }

  async getHistory(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.cashRegister.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          openedBy: { select: { id: true, firstName: true, lastName: true } },
          closedBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { sales: true } },
        },
      }),
      this.prisma.cashRegister.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
