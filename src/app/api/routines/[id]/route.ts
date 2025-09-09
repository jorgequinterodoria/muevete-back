import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { dayRoutineUpdateSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'
import { ZodIssue } from 'zod'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/routines/[id] - Obtener rutina específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const routineId = parseInt(id)

    if (isNaN(routineId)) {
      return createErrorResponse('ID de rutina inválido', 400)
    }

    const routine = await prisma.dayRoutine.findUnique({
      where: { id: routineId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        routineExercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                description: true,
                primaryMuscle: true,
                secondaryMuscles: true,
                type: true,
                difficulty: true,
                equipment: true,
                instructions: true,
                mediaUrl: true
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    })

    if (!routine) {
      return createErrorResponse('Rutina no encontrada', 404)
    }

    return createSuccessResponse(routine)
  } catch (error) {
    console.error('Error fetching routine:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}

// PUT /api/routines/[id] - Actualizar rutina
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const routineId = parseInt(id)

    if (isNaN(routineId)) {
      return createErrorResponse('ID de rutina inválido', 400)
    }

    const body = await request.json()
    const validation = dayRoutineUpdateSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.issues.map((issue: ZodIssue) => issue.message).join(', ')
      return createErrorResponse(errors, 400)
    }

    // Verificar que la rutina existe
    const existingRoutine = await prisma.dayRoutine.findUnique({
      where: { id: routineId }
    })

    if (!existingRoutine) {
      return createErrorResponse('Rutina no encontrada', 404)
    }

    const updatedRoutine = await prisma.dayRoutine.update({
      where: { id: routineId },
      data: validation.data,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        routineExercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                primaryMuscle: true,
                difficulty: true
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    })

    return createSuccessResponse(updatedRoutine)
  } catch (error) {
    console.error('Error updating routine:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}

// DELETE /api/routines/[id] - Eliminar rutina
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const routineId = parseInt(id)

    if (isNaN(routineId)) {
      return createErrorResponse('ID de rutina inválido', 400)
    }

    // Verificar que la rutina existe
    const existingRoutine = await prisma.dayRoutine.findUnique({
      where: { id: routineId },
      include: {
        routineExercises: true
      }
    })

    if (!existingRoutine) {
      return createErrorResponse('Rutina no encontrada', 404)
    }

    // Eliminar la rutina (esto también eliminará los ejercicios relacionados si hay cascada)
    await prisma.dayRoutine.delete({
      where: { id: routineId }
    })

    return createSuccessResponse({ message: 'Rutina eliminada exitosamente' })
  } catch (error) {
    console.error('Error deleting routine:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}