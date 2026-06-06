import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('El rol ya existe');

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        permissions: dto.permissionIds
          ? { create: dto.permissionIds.map((permissionId) => ({ permissionId })) }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });

    await this.auditService.log({
      action: 'CREATE',
      module: 'ROLES',
      description: `Rol creado: ${role.name}`,
    });

    return role;
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        users: { include: { user: true } },
      },
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado');

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;

    if (dto.permissionIds) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      await this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
      });
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: updateData,
      include: { permissions: { include: { permission: true } } },
    });

    await this.auditService.log({
      action: 'UPDATE',
      module: 'ROLES',
      description: `Rol actualizado: ${updated.name}`,
      oldValue: JSON.stringify({ name: role.name }),
      newValue: JSON.stringify({ name: updated.name }),
    });

    return updated;
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado');
    if (role.isSystem) throw new ConflictException('No se puede eliminar un rol del sistema');

    await this.prisma.role.delete({ where: { id } });
    await this.auditService.log({
      action: 'DELETE',
      module: 'ROLES',
      description: `Rol eliminado: ${role.name}`,
    });
  }
}
