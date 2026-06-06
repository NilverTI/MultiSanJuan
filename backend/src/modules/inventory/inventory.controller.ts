import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';

@ApiTags('Inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post('movements')
  @RequirePermissions('inventario.entrada', 'inventario.salida', 'inventario.ajuste')
  @ApiOperation({ summary: 'Crear movimiento de inventario' })
  createMovement(@Body() dto: CreateMovementDto, @CurrentUser('id') userId: string) {
    return this.inventoryService.createMovement(dto, userId);
  }

  @Get('movements')
  @RequirePermissions('inventario.ver_movimientos')
  @ApiOperation({ summary: 'Listar movimientos de inventario' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.inventoryService.findAll({ page, limit, productId, type, startDate, endDate });
  }
}
