import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SaleNotesService } from './sale-notes.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateSaleNoteDto } from './dto/sale-note.dto';

@ApiTags('Notas de Venta')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sale-notes')
export class SaleNotesController {
  constructor(private saleNotesService: SaleNotesService) {}

  @Post()
  @RequirePermissions('notas_venta.crear')
  create(@Body() dto: CreateSaleNoteDto, @CurrentUser('id') userId: string) {
    return this.saleNotesService.create(dto, userId);
  }

  @Get()
  @RequirePermissions('notas_venta.ver')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.saleNotesService.findAll({ page, limit, status });
  }

  @Get(':id')
  @RequirePermissions('notas_venta.ver')
  findById(@Param('id') id: string) {
    return this.saleNotesService.findById(id);
  }

  @Put(':id/status')
  @RequirePermissions('notas_venta.convertir_venta')
  updateStatus(@Param('id') id: string, @Body('status') status: 'CONVERTED' | 'CANCELLED') {
    return this.saleNotesService.updateStatus(id, status);
  }
}
