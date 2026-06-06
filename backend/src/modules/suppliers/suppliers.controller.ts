import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';

@ApiTags('Proveedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Post() @RequirePermissions('productos.crear')
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }
  @Get() @RequirePermissions('productos.ver')
  findAll() {
    return this.suppliersService.findAll();
  }
  @Get(':id') @RequirePermissions('productos.ver')
  findById(@Param('id') id: string) {
    return this.suppliersService.findById(id);
  }
  @Put(':id') @RequirePermissions('productos.editar')
  update(@Param('id') id: string, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }
  @Delete(':id') @RequirePermissions('productos.eliminar')
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
