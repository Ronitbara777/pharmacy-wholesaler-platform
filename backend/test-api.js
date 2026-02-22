const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // Count records
    const userCount = await prisma.user.count()
    const productCount = await prisma.product.count()
    const warehouseCount = await prisma.warehouse.count()
    
    console.log('📊 Database Stats:')
    console.log(`- Users: ${userCount}`)
    console.log(`- Products: ${productCount}`)
    console.log(`- Warehouses: ${warehouseCount}`)
    
    // Get recent products
    const products = await prisma.product.findMany({
      take: 5,
      include: { warehouse: true }
    })
    
    console.log('\n📦 Recent Products:')
    products.forEach(p => {
      console.log(`- ${p.name} (${p.quantity} units) @ ${p.warehouse.name}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

test()