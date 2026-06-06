import { IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenCashRegisterDto {
  @ApiProperty({ example: 200.0 })
  @IsNumber()
  @Min(0)
  initialAmount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observations?: string;
}
