import { IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloseCashRegisterDto {
  @ApiProperty({ example: 500.0 })
  @IsNumber()
  @Min(0)
  countedCash: number;

  @ApiProperty({ example: 200.0 })
  @IsNumber()
  @Min(0)
  countedYape: number;

  @ApiProperty({ example: 100.0 })
  @IsNumber()
  @Min(0)
  countedPlin: number;

  @ApiProperty({ example: 50.0 })
  @IsNumber()
  @Min(0)
  countedTransfer: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  countedCard: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observations?: string;
}
