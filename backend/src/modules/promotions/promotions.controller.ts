import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';

@ApiTags('Promociones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private promotionsService: PromotionsService) {}

  @Post()
  @RequirePermissions('promociones.crear')
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Get()
  @RequirePermissions('promociones.ver')
  findAll() {
    return this.promotionsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('promociones.ver')
  findById(@Param('id') id: string) {
    return this.promotionsService.findById(id);
  }

  @Put(':id')
  @RequirePermissions('promociones.editar')
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('promociones.eliminar')
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
