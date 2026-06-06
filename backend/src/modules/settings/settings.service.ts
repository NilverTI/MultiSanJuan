import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.setting.findMany({ orderBy: { group: 'asc' } });
  }

  async findByGroup(group: string) {
    return this.prisma.setting.findMany({ where: { group }, orderBy: { key: 'asc' } });
  }

  async update(key: string, value: string) {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException('Configuración no encontrada');

    const oldValue = setting.value;
    const updated = await this.prisma.setting.update({
      where: { key },
      data: { value },
    });

    await this.auditService.log({
      action: 'CONFIG_CHANGE',
      module: 'SETTINGS',
      description: `Configuración actualizada: ${key}`,
      oldValue,
      newValue: value,
    });

    return updated;
  }

  async get(key: string) {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    return setting?.value;
  }
}
