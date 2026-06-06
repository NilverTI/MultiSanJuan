import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';

@ApiTags('Configuración')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @RequirePermissions('configuracion.ver')
  findAll() {
    return this.settingsService.findAll();
  }

  @Get('group/:group')
  @RequirePermissions('configuracion.ver')
  findByGroup(@Param('group') group: string) {
    return this.settingsService.findByGroup(group);
  }

  @Put(':key')
  @RequirePermissions('configuracion.editar')
  update(@Param('key') key: string, @Body('value') value: string) {
    return this.settingsService.update(key, value);
  }
}
