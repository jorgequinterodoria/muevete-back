import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse, sanitizeUser } from '@/lib/utils'
import { userSchema } from '@/lib/validations'
import { UserRole } from '@prisma/client'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    const validation = userSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse(
        validation.error.issues.map((issue) => issue.message).join(', '),
        400
      )
    }
    
    const { email, password, name, role } = validation.data
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return createErrorResponse('El usuario ya existe', 409)
    }
    
    // Hash de la contraseña
    const hashedPassword = await hashPassword(password)
    
    // Crear usuario - CORREGIDO: usar los valores correctos del enum
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        passwordHash: hashedPassword,
        name,
        role: role === 'ADMIN' ? 'ADMIN' as UserRole : 'USER' as UserRole
      }
    })
    
    // Generar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })
    
    return createSuccessResponse({
      user: sanitizeUser(user),
      token
    }, 201)
    
  } catch (error) {
    console.error('Error en registro:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}