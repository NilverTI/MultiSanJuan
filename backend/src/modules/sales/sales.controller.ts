import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';

@ApiTags('Ventas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post()
  @RequirePermissions('ventas.crear')
  @ApiOperation({ summary: 'Crear venta (POS)' })
  create(@Body() dto: CreateSaleDto, @CurrentUser('id') userId: string) {
    return this.salesService.create(dto, userId);
  }

  @Get()
  @RequirePermissions('ventas.ver')
  @ApiOperation({ summary: 'Listar ventas' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    return this.salesService.findAll({
      page,
      limit,
      startDate,
      endDate,
      userId,
      customerId,
      status,
    });
  }

  @Get(':id')
  @RequirePermissions('ventas.ver')
  @ApiOperation({ summary: 'Obtener venta por ID' })
  findById(@Param('id') id: string) {
    return this.salesService.findById(id);
  }

  @Post(':id/cancel')
  @RequirePermissions('ventas.anular')
  @ApiOperation({ summary: 'Anular venta' })
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.salesService.cancel(id, userId);
  }
}
