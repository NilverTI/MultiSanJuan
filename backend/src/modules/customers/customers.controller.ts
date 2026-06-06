import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Post()
  @RequirePermissions('clientes.crear')
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get()
  @RequirePermissions('clientes.ver')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.customersService.findAll({ page, limit, search });
  }

  @Get(':id')
  @RequirePermissions('clientes.ver')
  findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Put(':id')
  @RequirePermissions('clientes.editar')
  update(@Param('id') id: string, @Body() dto: CreateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('clientes.eliminar')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
