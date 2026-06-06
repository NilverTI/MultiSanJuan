import { IsString, IsOptional, IsNumber, IsArray, Min, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SaleNoteItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  total?: number;
}

export class CreateSaleNoteDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  subtotal?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  total?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [SaleNoteItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleNoteItemDto)
  @IsOptional()
  items?: SaleNoteItemDto[];
}

export class UpdateSaleNoteStatusDto {
  @ApiProperty({ enum: ['PENDING', 'CONVERTED', 'CANCELLED'] })
  @IsEnum(['PENDING', 'CONVERTED', 'CANCELLED'] as const)
  status: 'PENDING' | 'CONVERTED' | 'CANCELLED';
}
