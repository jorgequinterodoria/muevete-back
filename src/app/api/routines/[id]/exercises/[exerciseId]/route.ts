import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { routineExerciseUpdateSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'
import { ZodIssue } from 'zod'

interface RouteParams {
  params: {
    id: string
    exerciseId: string
  }
}

// GET /api/routines/[id]/exercises/[exerciseId] - Obtener ejercicio específico de rutina
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const routineId = parseInt(params.id)
    const exerciseId = parseInt(params.exerciseId)

    if (isNaN(routineId) || isNaN(exerciseId)) {
      return createErrorResponse('IDs inválidos', 400)
    }

    const routineExercise = await prisma.routineExercise.findFirst({
      where: {
        routineId,
        id: exerciseId
      },
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
        },
        routine: {
          select: {
            id: true,
            clientId: true,
            week: true,
            day: true
          }
        }
      }
    })

    if (!routineExercise) {
      return createErrorResponse('Ejercicio no encontrado en esta rutina', 404)
    }

    return createSuccessResponse(routineExercise)
  } catch (error) {
    console.error('Error fetching routine exercise:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}

// PUT /api/routines/[id]/exercises/[exerciseId] - Actualizar ejercicio en rutina
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const routineId = parseInt(params.id)
    const exerciseId = parseInt(params.exerciseId)

    if (isNaN(routineId) || isNaN(exerciseId)) {
      return createErrorResponse('IDs inválidos', 400)
    }

    const body = await request.json()
    const validation = routineExerciseUpdateSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.issues.map((issue: ZodIssue) => issue.message).join(', ')
      return createErrorResponse(errors, 400)
    }

    // Verificar que el ejercicio existe en la rutina
    const existingRoutineExercise = await prisma.routineExercise.findFirst({
      where: {
        routineId,
        id: exerciseId
      }
    })

    if (!existingRoutineExercise) {
      return createErrorResponse('Ejercicio no encontrado en esta rutina', 404)
    }

    const updatedRoutineExercise = await prisma.routineExercise.update({
      where: { id: exerciseId },
      data: validation.data,
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
      }
    })

    return createSuccessResponse(updatedRoutineExercise)
  } catch (error) {
    console.error('Error updating routine exercise:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}

// DELETE /api/routines/[id]/exercises/[exerciseId] - Eliminar ejercicio de rutina
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const routineId = parseInt(params.id)
    const exerciseId = parseInt(params.exerciseId)

    if (isNaN(routineId) || isNaN(exerciseId)) {
      return createErrorResponse('IDs inválidos', 400)
    }

    // Verificar que el ejercicio existe en la rutina
    const existingRoutineExercise = await prisma.routineExercise.findFirst({
      where: {
        routineId,
        id: exerciseId
      }
    })

    if (!existingRoutineExercise) {
      return createErrorResponse('Ejercicio no encontrado en esta rutina', 404)
    }

    await prisma.routineExercise.delete({
      where: { id: exerciseId }
    })

    return createSuccessResponse({ message: 'Ejercicio eliminado de la rutina exitosamente' })
  } catch (error) {
    console.error('Error deleting routine exercise:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}

// PATCH /api/routines/[id]/exercises/[exerciseId] - Marcar ejercicio como completado/no completado
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const routineId = parseInt(params.id)
    const exerciseId = parseInt(params.exerciseId)

    if (isNaN(routineId) || isNaN(exerciseId)) {
      return createErrorResponse('IDs inválidos', 400)
    }

    const body = await request.json()
    const { completed } = body

    if (typeof completed !== 'boolean') {
      return createErrorResponse('El campo completed debe ser un booleano', 400)
    }

    // Verificar que el ejercicio existe en la rutina
    const existingRoutineExercise = await prisma.routineExercise.findFirst({
      where: {
        routineId,
        id: exerciseId
      }
    })

    if (!existingRoutineExercise) {
      return createErrorResponse('Ejercicio no encontrado en esta rutina', 404)
    }

    const updatedRoutineExercise = await prisma.routineExercise.update({
      where: { id: exerciseId },
      data: { completed },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            primaryMuscle: true
          }
        }
      }
    })

    return createSuccessResponse(updatedRoutineExercise)
  } catch (error) {
    console.error('Error updating exercise completion:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}