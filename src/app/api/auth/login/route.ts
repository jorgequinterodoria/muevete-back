import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse, sanitizeUser } from '@/lib/utils'
import { loginSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Datos inválidos', 400)
    }
    
    const { email, password } = validation.data
    
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      return createErrorResponse('Credenciales inválidas', 401)
    }
    
    // Verificar contraseña - CORREGIDO: usar passwordHash en lugar de password
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return createErrorResponse('Credenciales inválidas', 401)
    }
    
    // Generar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })
    
    return createSuccessResponse({
      user: sanitizeUser(user),
      token
    })
    
  } catch (error) {
    console.error('Error en login:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}