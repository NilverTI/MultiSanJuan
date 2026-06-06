import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePromotionDto) {
    return this.prisma.promotion.create({
      data: {
        ...dto,
        rules: dto.rules ? { create: dto.rules } : undefined,
      },
      include: { rules: true },
    });
  }

  async findAll() {
    return this.prisma.promotion.findMany({
      include: { rules: { include: { product: true, category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const promo = await this.prisma.promotion.findUnique({
      where: { id },
      include: { rules: { include: { product: true, category: true } } },
    });
    if (!promo) throw new NotFoundException('Promoción no encontrada');
    return promo;
  }

  async update(id: string, dto: UpdatePromotionDto) {
    await this.findById(id);
    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...dto,
        rules: dto.rules ? { deleteMany: {}, create: dto.rules } : undefined,
      },
      include: { rules: true },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.promotion.delete({ where: { id } });
  }
}
