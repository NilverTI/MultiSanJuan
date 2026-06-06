import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ferreteriaProducts = [
  { name: 'Martillo de Carpintero', sku: 'FER-001', purchasePrice: 15.0, salePrice: 25.0, stock: 20, minStock: 5, category: 'Herramientas Manuales', brand: 'Stanley', imageUrl: 'https://images.unsplash.com/photo-1540104539488-92a51bbc0410?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { name: 'Taladro Percutor 710W', sku: 'FER-002', purchasePrice: 120.0, salePrice: 180.0, stock: 10, minStock: 2, category: 'Herramientas Eléctricas', brand: 'Bosch', imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { name: 'Set de Destornilladores 6pzs', sku: 'FER-003', purchasePrice: 20.0, salePrice: 35.0, stock: 15, minStock: 3, category: 'Herramientas Manuales', brand: 'Truper', imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { name: 'Clavos de Acero 2" (1kg)', sku: 'FER-004', purchasePrice: 5.0, salePrice: 8.0, stock: 50, minStock: 10, category: 'Ferretería General', brand: 'Genérico', imageUrl: 'https://images.unsplash.com/photo-1518173434680-e1457100b411?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { name: 'Cinta Métrica 5m', sku: 'FER-005', purchasePrice: 12.0, salePrice: 18.0, stock: 30, minStock: 5, category: 'Herramientas de Medición', brand: 'Stanley', imageUrl: 'https://plus.unsplash.com/premium_photo-1678113426162-d27807b57cf6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { name: 'Llave Francesa 10"', sku: 'FER-006', purchasePrice: 25.0, salePrice: 40.0, stock: 12, minStock: 3, category: 'Herramientas Manuales', brand: 'Bahco', imageUrl: 'https://images.unsplash.com/photo-1581147036324-c17440858a1d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { name: 'Alicate Universal 8"', sku: 'FER-007', purchasePrice: 18.0, salePrice: 28.0, stock: 25, minStock: 5, category: 'Herramientas Manuales', brand: 'Truper', imageUrl: 'https://images.unsplash.com/photo-1530932297805-728b7eec93ed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { name: 'Pegamento PVC 1/4 Galón', sku: 'FER-008', purchasePrice: 10.0, salePrice: 16.0, stock: 40, minStock: 10, category: 'Adhesivos', brand: 'Oatey', imageUrl: 'https://plus.unsplash.com/premium_photo-1679075775765-b1a37c95fb52?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
];

const abarrotesProducts = [
  { name: 'Arroz Costeño Extra (5kg)', sku: 'ABA-001', purchasePrice: 15.0, salePrice: 22.0, stock: 100, minStock: 20, category: 'Abarrotes Básicos', brand: 'Costeño', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { name: 'Aceite Primor Premium (1L)', sku: 'ABA-002', purchasePrice: 8.5, salePrice: 11.5, stock: 80, minStock: 15, category: 'Abarrotes Básicos', brand: 'Primor', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { name: 'Leche Evaporada Gloria (400g)', sku: 'ABA-003', purchasePrice: 3.2, salePrice: 4.5, stock: 200, minStock: 50, category: 'Lácteos', brand: 'Gloria', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { name: 'Fideos Don Vittorio (500g)', sku: 'ABA-004', purchasePrice: 2.0, salePrice: 3.0, stock: 150, minStock: 30, category: 'Pastas', brand: 'Don Vittorio', imageUrl: 'https://images.unsplash.com/photo-1612869502759-54bc752ec300?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { name: 'Azúcar Rubia Cartavio (1kg)', sku: 'ABA-005', purchasePrice: 3.5, salePrice: 4.8, stock: 120, minStock: 25, category: 'Abarrotes Básicos', brand: 'Cartavio', imageUrl: 'https://images.unsplash.com/photo-1581423405763-71887e35b0b9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { name: 'Atún en Aceite Florida (170g)', sku: 'ABA-006', purchasePrice: 4.5, salePrice: 6.0, stock: 90, minStock: 20, category: 'Conservas', brand: 'Florida', imageUrl: 'https://images.unsplash.com/photo-1589139886737-25e683709b11?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
  { name: 'Avena Quaker Clásica (300g)', sku: 'ABA-007', purchasePrice: 2.5, salePrice: 3.8, stock: 60, minStock: 10, category: 'Abarrotes Básicos', brand: 'Quaker', imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
];

async function main() {
  const allProducts = [...ferreteriaProducts, ...abarrotesProducts];

  for (const item of allProducts) {
    const category = await prisma.category.upsert({
      where: { name: item.category },
      update: {},
      create: { name: item.category }
    });

    const brand = await prisma.brand.upsert({
      where: { name: item.brand },
      update: {},
      create: { name: item.brand }
    });

    const profitMargin = ((item.salePrice - item.purchasePrice) / item.purchasePrice) * 100;

    await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        stock: item.stock,
        salePrice: item.salePrice,
        mainImageUrl: item.imageUrl
      },
      create: {
        name: item.name,
        sku: item.sku,
        purchasePrice: item.purchasePrice,
        salePrice: item.salePrice,
        profitMargin: profitMargin,
        stock: item.stock,
        minStock: item.minStock,
        categoryId: category.id,
        brandId: brand.id,
        mainImageUrl: item.imageUrl,
        unitType: 'UNIDAD',
      }
    });

    console.log(`Created/Updated: ${item.name}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
