import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse, sanitizeUser } from '@/lib/utils'
import { UserRole } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Obtener usuario por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    if (!user) {
      return createErrorResponse('Usuario no encontrado', 404)
    }
    
    return createSuccessResponse(user)
    
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}

// PUT - Actualizar usuario
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { email, password, name, role } = body
    const { id } = await params
    
    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!existingUser) {
      return createErrorResponse('Usuario no encontrado', 404)
    }
    
    // Preparar datos de actualización con tipado correcto
    const updateData: {
      email?: string;
      name?: string;
      role?: UserRole;
      passwordHash?: string;
    } = {}
    
    if (email) updateData.email = email
    if (name) updateData.name = name
    if (role) updateData.role = role as UserRole
    if (password) updateData.passwordHash = await hashPassword(password)
    
    // Actualizar usuario
    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })
    
    return createSuccessResponse(sanitizeUser(user))
    
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}

// DELETE - Eliminar usuario
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Verificar si el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!existingUser) {
      return createErrorResponse('Usuario no encontrado', 404)
    }
    
    // Eliminar usuario
    await prisma.user.delete({
      where: { id }
    })
    
    return createSuccessResponse({ message: 'Usuario eliminado exitosamente' })
    
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}