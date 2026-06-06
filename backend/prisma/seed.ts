import { PrismaClient, ModuleName, AuditAction } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { name: 'usuarios.ver', module: 'USERS' as ModuleName, action: 'VIEW' },
  { name: 'usuarios.crear', module: 'USERS' as ModuleName, action: 'CREATE' },
  { name: 'usuarios.editar', module: 'USERS' as ModuleName, action: 'UPDATE' },
  { name: 'usuarios.eliminar', module: 'USERS' as ModuleName, action: 'DELETE' },
  { name: 'usuarios.activar', module: 'USERS' as ModuleName, action: 'ACTIVATE' },
  { name: 'usuarios.desactivar', module: 'USERS' as ModuleName, action: 'DEACTIVATE' },
  { name: 'productos.ver', module: 'PRODUCTS' as ModuleName, action: 'VIEW' },
  { name: 'productos.crear', module: 'PRODUCTS' as ModuleName, action: 'CREATE' },
  { name: 'productos.editar', module: 'PRODUCTS' as ModuleName, action: 'UPDATE' },
  { name: 'productos.eliminar', module: 'PRODUCTS' as ModuleName, action: 'DELETE' },
  { name: 'productos.actualizar_stock', module: 'PRODUCTS' as ModuleName, action: 'UPDATE_STOCK' },
  { name: 'ventas.ver', module: 'SALES' as ModuleName, action: 'VIEW' },
  { name: 'ventas.crear', module: 'SALES' as ModuleName, action: 'CREATE' },
  { name: 'ventas.anular', module: 'SALES' as ModuleName, action: 'CANCEL' },
  { name: 'caja.ver', module: 'CASH_REGISTER' as ModuleName, action: 'VIEW' },
  { name: 'caja.abrir', module: 'CASH_REGISTER' as ModuleName, action: 'OPEN' },
  { name: 'caja.cerrar', module: 'CASH_REGISTER' as ModuleName, action: 'CLOSE' },
  { name: 'caja.cuadrar', module: 'CASH_REGISTER' as ModuleName, action: 'RECONCILE' },
  { name: 'caja.ver_historial', module: 'CASH_REGISTER' as ModuleName, action: 'VIEW_HISTORY' },
  { name: 'inventario.ver', module: 'INVENTORY' as ModuleName, action: 'VIEW' },
  { name: 'inventario.entrada', module: 'INVENTORY' as ModuleName, action: 'ENTRY' },
  { name: 'inventario.salida', module: 'INVENTORY' as ModuleName, action: 'EXIT' },
  { name: 'inventario.ajuste', module: 'INVENTORY' as ModuleName, action: 'ADJUST' },
  { name: 'inventario.ver_movimientos', module: 'INVENTORY' as ModuleName, action: 'VIEW_MOVEMENTS' },
  { name: 'clientes.ver', module: 'CUSTOMERS' as ModuleName, action: 'VIEW' },
  { name: 'clientes.crear', module: 'CUSTOMERS' as ModuleName, action: 'CREATE' },
  { name: 'clientes.editar', module: 'CUSTOMERS' as ModuleName, action: 'UPDATE' },
  { name: 'clientes.eliminar', module: 'CUSTOMERS' as ModuleName, action: 'DELETE' },
  { name: 'promociones.ver', module: 'PROMOTIONS' as ModuleName, action: 'VIEW' },
  { name: 'promociones.crear', module: 'PROMOTIONS' as ModuleName, action: 'CREATE' },
  { name: 'promociones.editar', module: 'PROMOTIONS' as ModuleName, action: 'UPDATE' },
  { name: 'promociones.eliminar', module: 'PROMOTIONS' as ModuleName, action: 'DELETE' },
  { name: 'cotizaciones.ver', module: 'QUOTES' as ModuleName, action: 'VIEW' },
  { name: 'cotizaciones.crear', module: 'QUOTES' as ModuleName, action: 'CREATE' },
  { name: 'cotizaciones.convertir_venta', module: 'QUOTES' as ModuleName, action: 'CONVERT' },
  { name: 'notas_venta.ver', module: 'SALE_NOTES' as ModuleName, action: 'VIEW' },
  { name: 'notas_venta.crear', module: 'SALE_NOTES' as ModuleName, action: 'CREATE' },
  { name: 'notas_venta.convertir_venta', module: 'SALE_NOTES' as ModuleName, action: 'CONVERT' },
  { name: 'reportes.ver', module: 'REPORTS' as ModuleName, action: 'VIEW' },
  { name: 'reportes.exportar_pdf', module: 'REPORTS' as ModuleName, action: 'EXPORT_PDF' },
  { name: 'reportes.exportar_excel', module: 'REPORTS' as ModuleName, action: 'EXPORT_EXCEL' },
  { name: 'auditoria.ver', module: 'AUDIT' as ModuleName, action: 'VIEW' },
  { name: 'configuracion.ver', module: 'SETTINGS' as ModuleName, action: 'VIEW' },
  { name: 'configuracion.editar', module: 'SETTINGS' as ModuleName, action: 'UPDATE' },
];

const SETTINGS = [
  { key: 'business_name', value: 'MULTI SAN JUAN', type: 'string', group: 'business' },
  { key: 'business_address', value: 'Av. Principal 123', type: 'string', group: 'business' },
  { key: 'business_phone', value: '999 888 777', type: 'string', group: 'business' },
  { key: 'business_ruc', value: '20123456789', type: 'string', group: 'business' },
  { key: 'tax_rate', value: '18', type: 'number', group: 'tax' },
  { key: 'ticket_footer', value: '¡Gracias por su compra!', type: 'string', group: 'printing' },
  { key: 'currency', value: 'S/', type: 'string', group: 'business' },
  { key: 'dark_mode', value: 'false', type: 'boolean', group: 'appearance' },
  { key: 'primary_color', value: '#0F172A', type: 'string', group: 'appearance' },
  { key: 'secondary_color', value: '#3B82F6', type: 'string', group: 'appearance' },
];

async function main() {
  console.log('🌱 Iniciando seed...');

  // Create permissions
  console.log('📝 Creando permisos...');
  const permissionRecords: any[] = [];
  for (const perm of PERMISSIONS) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    permissionRecords.push(p);
  }
  console.log(`   ${permissionRecords.length} permisos creados`);

  // Create roles
  console.log('👥 Creando roles...');
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Acceso total al sistema',
      isSystem: true,
      permissions: {
        create: permissionRecords.map((p) => ({ permissionId: p.id })),
      },
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrador' },
    update: {},
    create: {
      name: 'Administrador',
      description: 'Administrador con acceso a gestión',
      isSystem: true,
      permissions: {
        create: permissionRecords
          .filter((p) => !p.name.includes('eliminar') && !p.name.includes('auditoria'))
          .map((p) => ({ permissionId: p.id })),
      },
    },
  });

  await prisma.role.upsert({
    where: { name: 'Cajero' },
    update: {},
    create: {
      name: 'Cajero',
      description: 'Acceso a POS y caja',
      isSystem: true,
      permissions: {
        create: permissionRecords
          .filter((p) =>
            ['ventas.ver', 'ventas.crear', 'caja.', 'clientes.ver', 'clientes.crear', 'productos.ver']
              .some((pref) => p.name.startsWith(pref)),
          )
          .map((p) => ({ permissionId: p.id })),
      },
    },
  });

  await prisma.role.upsert({
    where: { name: 'Vendedor' },
    update: {},
    create: {
      name: 'Vendedor',
      description: 'Acceso a ventas y clientes',
      isSystem: true,
      permissions: {
        create: permissionRecords
          .filter((p) =>
            ['ventas.ver', 'ventas.crear', 'clientes.', 'productos.ver', 'cotizaciones.', 'notas_venta.']
              .some((pref) => p.name.startsWith(pref)),
          )
          .map((p) => ({ permissionId: p.id })),
      },
    },
  });

  await prisma.role.upsert({
    where: { name: 'Almacenero' },
    update: {},
    create: {
      name: 'Almacenero',
      description: 'Acceso a inventario y productos',
      isSystem: true,
      permissions: {
        create: permissionRecords
          .filter((p) =>
            ['productos.', 'inventario.', 'categorías']
              .some((pref) => p.name.includes(pref)),
          )
          .map((p) => ({ permissionId: p.id })),
      },
    },
  });

  console.log('   Roles creados');

  // Create admin user
  console.log('👤 Creando usuario administrador...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@multisanjuan.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'Sistema',
      email: 'admin@multisanjuan.com',
      username: 'admin',
      password: hashedPassword,
      dni: '00000000',
      status: 'ACTIVE',
      roles: {
        create: { roleId: superAdminRole.id },
      },
    },
  });
  console.log(`   Admin: admin / admin123`);

  // Create default categories
  console.log('📦 Creando categorías...');
  const categories = [
    { name: 'Bebidas', description: 'Gaseosas, aguas, jugos' },
    { name: 'Cigarrillos', description: 'Cigarros y tabaco' },
    { name: 'Snacks', description: 'Botanas y aperitivos' },
    { name: 'Golosinas', description: 'Dulces, chicles, caramelos' },
    { name: 'Limpieza', description: 'Productos de limpieza' },
    { name: 'Aseo Personal', description: 'Productos de cuidado personal' },
    { name: 'Lácteos', description: 'Leche, yogur, queso' },
    { name: 'Abarrotes', description: 'Productos de despensa' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log(`   ${categories.length} categorías creadas`);

  // Create settings
  console.log('⚙️ Creando configuraciones...');
  for (const setting of SETTINGS) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`   ${SETTINGS.length} configuraciones creadas`);

  console.log('✅ Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
