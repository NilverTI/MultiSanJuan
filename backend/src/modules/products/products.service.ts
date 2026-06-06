import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateProductDto) {
    const existingSku = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existingSku) throw new ConflictException('El SKU ya existe');

    const profitMargin =
      dto.purchasePrice > 0 ? ((dto.salePrice - dto.purchasePrice) / dto.purchasePrice) * 100 : 0;

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        sku: dto.sku,
        unitType: dto.unitType || 'UNIDAD',
        purchasePrice: dto.purchasePrice,
        salePrice: dto.salePrice,
        profitMargin: Math.round(profitMargin * 100) / 100,
        stock: dto.stock,
        minStock: dto.minStock || 0,
        maxStock: dto.maxStock || 999999,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        brandId: dto.brandId,
        supplierId: dto.supplierId,
        mainImageUrl: dto.mainImageUrl,
        barcodes: dto.barcodes
          ? { create: dto.barcodes.map((b) => ({ barcode: b.barcode })) }
          : undefined,
        presentations: dto.presentations
          ? {
              create: dto.presentations.map((p) => ({
                name: p.name,
                quantity: p.quantity,
                salePrice: p.salePrice,
                barcode: p.barcode,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        brand: true,
        barcodes: true,
        presentations: true,
      },
    });

    await this.auditService.log({
      action: 'CREATE',
      module: 'PRODUCTS',
      description: `Producto creado: ${product.name} (SKU: ${product.sku})`,
      referenceId: product.id,
    });

    return product;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    isActive?: string;
    lowStock?: string;
  }) {
    const { page = 1, limit = 50, search, categoryId, brandId, isActive, lowStock } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcodes: { some: { barcode: { contains: search } } } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    if (lowStock === 'true') {
      const allProducts = await this.prisma.product.findMany({
        where: { deletedAt: null, isActive: true },
        select: { id: true, stock: true, minStock: true },
      });
      const lowStockIds = allProducts.filter((p) => p.stock <= p.minStock).map((p) => p.id);
      where.id = { in: lowStockIds };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          barcodes: true,
          presentations: true,
          images: { orderBy: { order: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ barcodes: { some: { barcode } } }, { presentations: { some: { barcode } } }],
      },
      include: {
        category: true,
        brand: true,
        barcodes: true,
        presentations: true,
      },
    });
    return product;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: true,
        subcategory: true,
        brand: true,
        supplier: true,
        barcodes: true,
        presentations: true,
        images: { orderBy: { order: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id, deletedAt: null } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.unitType) updateData.unitType = dto.unitType;
    if (dto.purchasePrice !== undefined) updateData.purchasePrice = dto.purchasePrice;
    if (dto.salePrice !== undefined) updateData.salePrice = dto.salePrice;
    if (dto.stock !== undefined) updateData.stock = dto.stock;
    if (dto.minStock !== undefined) updateData.minStock = dto.minStock;
    if (dto.maxStock !== undefined) updateData.maxStock = dto.maxStock;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.subcategoryId !== undefined) updateData.subcategoryId = dto.subcategoryId;
    if (dto.brandId !== undefined) updateData.brandId = dto.brandId;
    if (dto.supplierId !== undefined) updateData.supplierId = dto.supplierId;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive === 'true';
    if (dto.mainImageUrl !== undefined) updateData.mainImageUrl = dto.mainImageUrl;

    if (dto.purchasePrice !== undefined && dto.salePrice !== undefined) {
      const margin =
        dto.purchasePrice > 0 ? ((dto.salePrice - dto.purchasePrice) / dto.purchasePrice) * 100 : 0;
      updateData.profitMargin = Math.round(margin * 100) / 100;
    }

    if (dto.barcodes) {
      await this.prisma.productBarcode.deleteMany({ where: { productId: id } });
      await this.prisma.productBarcode.createMany({
        data: dto.barcodes.map((b) => ({ productId: id, barcode: b.barcode })),
      });
    }

    if (dto.presentations) {
      await this.prisma.productPresentation.deleteMany({ where: { productId: id } });
      await this.prisma.productPresentation.createMany({
        data: dto.presentations
          .filter(
            (p): p is { name: string; quantity?: number; salePrice?: number; barcode?: string } =>
              !!p.name,
          )
          .map((p) => ({
            productId: id,
            name: p.name,
            quantity: p.quantity,
            salePrice: p.salePrice,
            barcode: p.barcode,
          })),
      });
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, brand: true, barcodes: true, presentations: true },
    });

    await this.auditService.log({
      action: 'UPDATE',
      module: 'PRODUCTS',
      description: `Producto actualizado: ${updated.name}`,
      oldValue: JSON.stringify({ salePrice: product.salePrice.toString(), stock: product.stock }),
      newValue: JSON.stringify({ salePrice: updated.salePrice.toString(), stock: updated.stock }),
      referenceId: id,
    });

    return updated;
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id, deletedAt: null } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      action: 'DELETE',
      module: 'PRODUCTS',
      description: `Producto eliminado: ${product.name}`,
      referenceId: id,
    });
  }
}
