import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('sales')
  @RequirePermissions('reportes.ver')
  @ApiOperation({ summary: 'Reporte de ventas' })
  salesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
  ) {
    return this.reportsService.salesReport({ startDate, endDate, userId });
  }

  @Get('products')
  @RequirePermissions('reportes.ver')
  @ApiOperation({ summary: 'Reporte de productos' })
  productsReport() {
    return this.reportsService.productsReport();
  }

  @Get('inventory')
  @RequirePermissions('reportes.ver')
  @ApiOperation({ summary: 'Reporte de inventario y stock' })
  inventoryReport() {
    return this.reportsService.inventoryReport();
  }

  @Get('financial')
  @RequirePermissions('reportes.ver')
  @ApiOperation({ summary: 'Reporte financiero' })
  financialReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.financialReport({ startDate, endDate });
  }

  @Get('customers')
  @RequirePermissions('reportes.ver')
  @ApiOperation({ summary: 'Reporte de clientes' })
  customerReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.customerReport({ startDate, endDate });
  }

  @Get('stock-alerts')
  @RequirePermissions('reportes.ver')
  @ApiOperation({ summary: 'Alertas de stock' })
  stockAlerts() {
    return this.reportsService.stockAlerts();
  }
}
