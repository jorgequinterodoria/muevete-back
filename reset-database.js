const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🗑️  Limpiando base de datos...');
    
    // Eliminar todos los datos existentes (orden importante por las relaciones)
    await prisma.exercise.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('✅ Base de datos limpiada');
    
    console.log('🌱 Creando datos de prueba...');
    
    // Crear usuarios de prueba
    const users = [
      {
        email: 'admin@muevete.com',
        name: 'Administrador',
        role: 'ADMIN',
        password: 'admin123'
      },
      {
        email: 'user1@muevete.com',
        name: 'Usuario Uno',
        role: 'USER',
        password: 'user123'
      },
      {
        email: 'user2@muevete.com',
        name: 'Usuario Dos',
        role: 'USER',
        password: 'user123'
      },
      {
        email: 'trainer@muevete.com',
        name: 'Entrenador',
        role: 'USER',
        password: 'trainer123'
      }
    ];
    
    const createdUsers = [];
    
    // Crear usuarios con contraseñas hasheadas
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          passwordHash: hashedPassword
        }
      });
      
      createdUsers.push(user);
      console.log(`👤 Usuario creado: ${user.email} (${user.role})`);
    }
    
    // Obtener usuarios para crear ejercicios
    const adminUser = createdUsers.find(u => u.role === 'ADMIN');
    const regularUser = createdUsers.find(u => u.role === 'USER');
    
    // Crear ejercicios de prueba
    const exercises = [
      {
        name: 'Flexiones de Pecho',
        description: 'Ejercicio básico para fortalecer el pecho y brazos',
        muscleGroup: 'Pecho',
        difficulty: 'Principiante',
        instructions: 'Colócate en posición de plancha, baja el cuerpo hasta casi tocar el suelo y empuja hacia arriba.',
        createdById: adminUser.id
      },
      {
        name: 'Sentadillas',
        description: 'Ejercicio fundamental para piernas y glúteos',
        muscleGroup: 'Piernas',
        difficulty: 'Principiante',
        instructions: 'Párate con los pies separados al ancho de los hombros, baja como si te fueras a sentar y regresa a la posición inicial.',
        createdById: adminUser.id
      },
      {
        name: 'Plancha',
        description: 'Ejercicio isométrico para el core',
        muscleGroup: 'Abdomen',
        difficulty: 'Intermedio',
        instructions: 'Mantén el cuerpo recto apoyándote en antebrazos y puntas de los pies.',
        createdById: regularUser.id
      },
      {
        name: 'Burpees',
        description: 'Ejercicio completo de cuerpo entero',
        muscleGroup: 'Cuerpo completo',
        difficulty: 'Avanzado',
        instructions: 'Desde posición de pie, baja a cuclillas, salta hacia atrás a plancha, haz una flexión, salta hacia adelante y salta hacia arriba.',
        createdById: adminUser.id
      },
      {
        name: 'Dominadas',
        description: 'Ejercicio para espalda y bíceps',
        muscleGroup: 'Espalda',
        difficulty: 'Avanzado',
        instructions: 'Cuelga de una barra y tira de tu cuerpo hacia arriba hasta que la barbilla pase la barra.',
        createdById: regularUser.id
      }
    ];
    
    for (const exerciseData of exercises) {
      const exercise = await prisma.exercise.create({
        data: exerciseData
      });
      
      console.log(`💪 Ejercicio creado: ${exercise.name} (${exercise.difficulty})`);
    }
    
    console.log('\n🎉 Base de datos reiniciada exitosamente!');
    console.log('\n📊 Resumen de datos creados:');
    
    const userCount = await prisma.user.count();
    const exerciseCount = await prisma.exercise.count();
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const userRoleCount = await prisma.user.count({ where: { role: 'USER' } });
    
    console.log(`   • ${userCount} usuarios totales`);
    console.log(`   • ${adminCount} administradores`);
    console.log(`   • ${userRoleCount} usuarios regulares`);
    console.log(`   • ${exerciseCount} ejercicios`);
    
    console.log('\n🔑 Credenciales de prueba:');
    console.log('   Admin: admin@muevete.com / admin123');
    console.log('   Usuario: user1@muevete.com / user123');
    
  } catch (error) {
    console.error('❌ Error al reiniciar la base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };