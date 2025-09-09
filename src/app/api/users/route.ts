import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse, sanitizeUser } from '@/lib/utils'
import { userSchema } from '@/lib/validations'
import { UserRole } from '@prisma/client'
import { randomUUID } from 'crypto'

// GET - Obtener todos los usuarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          birthDate: true,
          registrationDate: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          dayRoutines: true
        }
      }),
      prisma.user.count()
    ])
    
    return createSuccessResponse({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}

// POST - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos
    const validation = userSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse(
        validation.error.issues.map((issue) => issue.message).join(', '),
        400
      )
    }
    
    const { email, password, name, role } = validation.data
    
    // Verificar si existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return createErrorResponse('El usuario ya existe', 409)
    }
    
    // Crear usuario
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        passwordHash: hashedPassword,
        name,
        role: role === 'ADMIN' ? 'ADMIN' as UserRole : 'USER' as UserRole
      }
    })
    
    return createSuccessResponse(sanitizeUser(user), 201)
    
  } catch (error) {
    console.error('Error creando usuario:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}