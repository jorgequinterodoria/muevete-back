const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  const prisma = new PrismaClient()
  try {
    await prisma.$connect()
    console.log('✅ Conexión a la base de datos exitosa')
    
    // Probar una consulta simple
    const userCount = await prisma.user.count()
    console.log(`📊 Número de usuarios: ${userCount}`)
  } catch (error) {
    console.error('❌ Error de conexión:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()