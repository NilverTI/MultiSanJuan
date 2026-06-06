import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';

@ApiTags('Marcas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('brands')
export class BrandsController {
  constructor(private brandsService: BrandsService) {}

  @Post()
  @RequirePermissions('productos.crear')
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Get()
  @RequirePermissions('productos.ver')
  findAll() {
    return this.brandsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('productos.ver')
  findById(@Param('id') id: string) {
    return this.brandsService.findById(id);
  }

  @Put(':id')
  @RequirePermissions('productos.editar')
  update(@Param('id') id: string, @Body() dto: CreateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('productos.eliminar')
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
