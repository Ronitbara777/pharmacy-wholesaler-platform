const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function emptyDB() {
  await prisma.tempData.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  console.log('Database emptied (Users and Warehouses kept)');
}

emptyDB()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
