import { Module } from '@nestjs/common';
import { SaleNotesController } from './sale-notes.controller';
import { SaleNotesService } from './sale-notes.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [SaleNotesController],
  providers: [SaleNotesService],
})
export class SaleNotesModule {}
