import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CashRegisterService } from './cash-register.service';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';

@ApiTags('Caja')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private cashRegisterService: CashRegisterService) {}

  @Post('open')
  @RequirePermissions('caja.abrir')
  @ApiOperation({ summary: 'Abrir caja' })
  open(@Body() dto: OpenCashRegisterDto, @CurrentUser('id') userId: string) {
    return this.cashRegisterService.open(dto, userId);
  }

  @Post('close')
  @RequirePermissions('caja.cerrar')
  @ApiOperation({ summary: 'Cerrar caja' })
  close(@Body() dto: CloseCashRegisterDto, @CurrentUser('id') userId: string) {
    return this.cashRegisterService.close(dto, userId);
  }

  @Get('current')
  @RequirePermissions('caja.ver')
  @ApiOperation({ summary: 'Estado actual de caja' })
  getCurrentStatus() {
    return this.cashRegisterService.getCurrentStatus();
  }

  @Get('history')
  @RequirePermissions('caja.ver_historial')
  @ApiOperation({ summary: 'Historial de cierres' })
  getHistory(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.cashRegisterService.getHistory(page, limit);
  }
}
