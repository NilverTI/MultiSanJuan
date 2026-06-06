import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Bebidas' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Bebidas gaseosas, aguas, jugos' })
  @IsString()
  @IsOptional()
  description?: string;
}
