const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create warehouses
  const warehouse1 = await prisma.warehouse.create({
    data: {
      name: 'Main Warehouse',
      location: 'Building A, Sector 1',
      capacity: 1000,
      usedSpace: 450,
    }
  })

  const warehouse2 = await prisma.warehouse.create({
    data: {
      name: 'Cold Storage',
      location: 'Building B, Sector 2',
      capacity: 500,
      usedSpace: 200,
    }
  })

  console.log('✅ Warehouses created')

  // Create users
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@pharmacy.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      warehouseId: warehouse1.id,
    }
  })

  const manager = await prisma.user.create({
    data: {
      email: 'manager@pharmacy.com',
      password: hashedPassword,
      name: 'Manager User',
      role: 'MANAGER',
      warehouseId: warehouse1.id,
    }
  })

  console.log('✅ Users created')

  // Create products
  const product1 = await prisma.product.create({
    data: {
      name: 'Paracetamol 500mg',
      batchNumber: 'B2024-001',
      expiryDate: new Date('2024-12-15'),
      quantity: 500,
      price: 2.5,
      mrp: 3.0,
      company: 'GSK',
      category: 'Analgesic',
      manufacturer: 'GlaxoSmithKline',
      warehouseId: warehouse1.id,
      shelf: 'A-12',
      rack: 'Rack 3',
      reorderLevel: 100,
    }
  })

  const product2 = await prisma.product.create({
    data: {
      name: 'Amoxicillin 250mg',
      batchNumber: 'B2024-002',
      expiryDate: new Date('2024-11-30'),
      quantity: 300,
      price: 5.0,
      mrp: 6.5,
      company: 'Cipla',
      category: 'Antibiotic',
      manufacturer: 'Cipla Ltd',
      warehouseId: warehouse1.id,
      shelf: 'B-05',
      rack: 'Rack 1',
      reorderLevel: 100,
    }
  })

  console.log('✅ Products created')

  // Create stock movements
  await prisma.stockMovement.create({
    data: {
      type: 'STOCK_IN',
      quantity: 500,
      productId: product1.id,
      userId: admin.id,
      party: 'Supplier ABC',
      invoiceNo: 'INV-2024-001',
      batchNumber: 'B2024-001',
      expiryDate: new Date('2024-12-15'),
      price: 2.5,
      totalAmount: 1250,
    }
  })

  await prisma.stockMovement.create({
    data: {
      type: 'STOCK_OUT',
      quantity: 50,
      productId: product2.id,
      userId: manager.id,
      party: 'City Medical Store',
      invoiceNo: 'SALE-2024-001',
      batchNumber: 'B2024-002',
      price: 5.0,
      totalAmount: 250,
    }
  })

  console.log('✅ Stock movements created')

  // Create notifications
  await prisma.notification.create({
    data: {
      type: 'EXPIRY',
      title: 'Products Expiring Soon',
      message: 'Paracetamol will expire in 30 days',
      severity: 'HIGH',
      userId: admin.id,
      productId: product1.id,
    }
  })

  await prisma.notification.create({
    data: {
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: 'Amoxicillin is below reorder level',
      severity: 'MEDIUM',
      userId: admin.id,
      productId: product2.id,
    }
  })

  console.log('✅ Notifications created')

  // Create activity logs
  await prisma.activity.create({
    data: {
      action: 'CREATE',
      entityType: 'PRODUCT',
      entityId: product1.id,
      userId: admin.id,
      details: { product: 'Paracetamol 500mg' },
      device: 'Seed Script',
    }
  })

  await prisma.activity.create({
    data: {
      action: 'STOCK_IN',
      entityType: 'MOVEMENT',
      userId: admin.id,
      details: { quantity: 500, product: 'Paracetamol' },
      device: 'Seed Script',
    }
  })

  console.log('✅ Activities created')
  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })