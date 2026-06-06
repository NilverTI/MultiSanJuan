import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateUserDto) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('El email ya está registrado');

    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) throw new ConflictException('El nombre de usuario ya existe');

    if (dto.dni) {
      const existingDni = await this.prisma.user.findUnique({ where: { dni: dto.dni } });
      if (existingDni) throw new ConflictException('El DNI ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dni: dto.dni,
        phone: dto.phone,
        address: dto.address,
        roles: {
          create: dto.roleIds.map((roleId) => ({ roleId })),
        },
      },
      include: { roles: { include: { role: true } } },
    });

    await this.auditService.log({
      userId: user.id,
      action: 'CREATE',
      module: 'USERS',
      description: `Usuario creado: ${user.username}`,
    });

    const { password, ...result } = user;
    return result;
  }

  async findAll(params: { page?: number; limit?: number; search?: string; status?: string }) {
    const { page = 1, limit = 50, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { roles: { include: { role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const safeData = data.map(({ password, refreshToken, ...rest }) => rest);
    return { data: safeData, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { password, refreshToken, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const updateData: any = {};
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.email) updateData.email = dto.email;
    if (dto.username) updateData.username = dto.username;
    if (dto.dni) updateData.dni = dto.dni;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.address) updateData.address = dto.address;
    if (dto.status) updateData.status = dto.status;
    if (dto.password) updateData.password = await bcrypt.hash(dto.password, 10);

    if (dto.roleIds) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      await this.prisma.userRole.createMany({
        data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
      });
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { roles: { include: { role: true } } },
    });

    await this.auditService.log({
      userId: id,
      action: 'UPDATE',
      module: 'USERS',
      description: `Usuario actualizado: ${updated.username}`,
      oldValue: JSON.stringify({
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
      }),
      newValue: JSON.stringify({
        firstName: updated.firstName,
        lastName: updated.lastName,
        status: updated.status,
      }),
    });

    const { password, ...result } = updated;
    return result;
  }

  async remove(id: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new ForbiddenException('No puedes eliminarte a ti mismo');
    }
    const user = await this.prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await this.auditService.log({
      userId: requestingUserId,
      action: 'DELETE',
      module: 'USERS',
      description: `Usuario eliminado: ${user.username}`,
    });
  }

  async toggleStatus(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });

    await this.auditService.log({
      userId: id,
      action: newStatus === 'ACTIVE' ? 'ACTIVATE' : 'DEACTIVATE',
      module: 'USERS',
      description: `Usuario ${newStatus === 'ACTIVE' ? 'activado' : 'desactivado'}: ${user.username}`,
    });

    return updated;
  }
}
