import { IsString, IsOptional, IsNumber, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class BarcodeDto {
  @ApiProperty()
  @IsString()
  barcode: string;
}

class PresentationDto {
  @ApiProperty({ example: 'Cajetilla' })
  @IsString()
  name: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 10.5 })
  @IsNumber()
  @Min(0)
  salePrice: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Cigarro X' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'SKU-001' })
  @IsString()
  sku: string;

  @ApiPropertyOptional({ example: 'UNIDAD' })
  @IsString()
  @IsOptional()
  unitType?: string;

  @ApiProperty({ example: 5.0 })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ example: 10.0 })
  @IsNumber()
  @Min(0)
  salePrice: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxStock?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subcategoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({ type: [BarcodeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BarcodeDto)
  @IsOptional()
  barcodes?: BarcodeDto[];

  @ApiPropertyOptional({ type: [PresentationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresentationDto)
  @IsOptional()
  presentations?: PresentationDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mainImageUrl?: string;
}
