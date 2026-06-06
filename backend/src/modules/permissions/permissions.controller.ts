import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ModuleName } from '@prisma/client';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';

@ApiTags('Permisos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('usuarios.ver')
  @ApiOperation({ summary: 'Listar todos los permisos' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('module/:module')
  @RequirePermissions('usuarios.ver')
  @ApiOperation({ summary: 'Permisos por módulo' })
  findByModule(@Param('module') module: string) {
    return this.permissionsService.findByModule(module as ModuleName);
  }

  @Get('role/:roleId')
  @RequirePermissions('usuarios.ver')
  @ApiOperation({ summary: 'Permisos por rol' })
  findByRoleId(@Param('roleId') roleId: string) {
    return this.permissionsService.findByRoleId(roleId);
  }
}
