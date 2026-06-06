import { IsString, IsEmail, IsOptional, MinLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'admin@multisanjuan.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsString()
  @IsOptional()
  dni?: string;

  @ApiPropertyOptional({ example: '999888777' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Av. Siempre Viva 123' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: ['role-id'] })
  @IsArray()
  @IsString({ each: true })
  roleIds: string[];
}
