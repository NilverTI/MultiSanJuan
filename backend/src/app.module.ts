import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SalesModule } from './modules/sales/sales.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { SaleNotesModule } from './modules/sale-notes/sale-notes.module';
import { AuditModule } from './modules/audit/audit.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    SuppliersModule,
    CustomersModule,
    SalesModule,
    CashRegisterModule,
    InventoryModule,
    PromotionsModule,
    QuotesModule,
    SaleNotesModule,
    AuditModule,
    ReportsModule,
    SettingsModule,
    DashboardModule,
    EmailModule,
  ],
})
export class AppModule {}
