import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Nombre de usuario o email' })
  @IsString()
  @MinLength(3)
  usernameOrEmail: string;

  @ApiProperty({ example: 'admin123', description: 'Contraseña' })
  @IsString()
  @MinLength(6)
  password: string;
}
