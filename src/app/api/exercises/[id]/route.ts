import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { exerciseUpdateSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'
import { ZodIssue } from 'zod'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/exercises/[id] - Obtener ejercicio específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        routineExercises: {
          include: {
            routine: {
              include: {
                client: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!exercise) {
      return createErrorResponse('Ejercicio no encontrado', 404)
    }

    return createSuccessResponse(exercise)
  } catch (error) {
    console.error('Error fetching exercise:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}

// PUT /api/exercises/[id] - Actualizar ejercicio
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()

    const validation = exerciseUpdateSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.issues.map((issue: ZodIssue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
      return createErrorResponse(`Datos de entrada inválidos: ${errors.map(e => e.message).join(', ')}`, 400)
    }

    // Verificar si el ejercicio existe
    const existingExercise = await prisma.exercise.findUnique({
      where: { id }
    })

    if (!existingExercise) {
      return createErrorResponse('Ejercicio no encontrado', 404)
    }

    // Si se está actualizando el nombre, verificar que no exista otro ejercicio con el mismo nombre
    if (validation.data.name && validation.data.name !== existingExercise.name) {
      const duplicateExercise = await prisma.exercise.findFirst({
        where: {
          name: { equals: validation.data.name, mode: 'insensitive' },
          id: { not: id }
        }
      })

      if (duplicateExercise) {
        return createErrorResponse('Ya existe un ejercicio con este nombre', 409)
      }
    }

    // Preparar datos para actualización, convirtiendo difficulty a minúsculas
    const updateData: any = { ...validation.data }
    if (updateData.difficulty) {
      updateData.difficulty = updateData.difficulty.toLowerCase()
    }

    const updatedExercise = await prisma.exercise.update({
      where: { id },
      data: updateData
    })

    return createSuccessResponse(updatedExercise)
  } catch (error) {
    console.error('Error updating exercise:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}

// DELETE /api/exercises/[id] - Eliminar ejercicio
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    // Verificar si el ejercicio existe
    const existingExercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        routineExercises: true
      }
    })

    if (!existingExercise) {
      return createErrorResponse('Ejercicio no encontrado', 404)
    }

    // Verificar si el ejercicio está siendo usado en rutinas
    if (existingExercise.routineExercises.length > 0) {
      return createErrorResponse(
        'No se puede eliminar el ejercicio porque está siendo usado en rutinas activas',
        409
      )
    }

    await prisma.exercise.delete({
      where: { id }
    })

    return createSuccessResponse({ message: 'Ejercicio eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting exercise:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}