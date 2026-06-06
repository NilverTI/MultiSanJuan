import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Vendedor' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Rol para vendedores' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: ['perm-id-1', 'perm-id-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];
}
