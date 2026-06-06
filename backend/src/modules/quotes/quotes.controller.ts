import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateQuoteDto } from './dto/create-quote.dto';

@ApiTags('Cotizaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Post()
  @RequirePermissions('cotizaciones.crear')
  create(@Body() dto: CreateQuoteDto, @CurrentUser('id') userId: string) {
    return this.quotesService.create(dto, userId);
  }

  @Get()
  @RequirePermissions('cotizaciones.ver')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.quotesService.findAll({ page, limit, status });
  }

  @Get(':id')
  @RequirePermissions('cotizaciones.ver')
  findById(@Param('id') id: string) {
    return this.quotesService.findById(id);
  }

  @Put(':id/status')
  @RequirePermissions('cotizaciones.convertir_venta')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.quotesService.updateStatus(id, status);
  }
}
