import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { routineExerciseSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'
import { ZodIssue } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/routines/[id]/exercises - Obtener ejercicios de una rutina
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const routineId = parseInt(params.id)

    if (isNaN(routineId)) {
      return createErrorResponse('ID de rutina inválido', 400)
    }

    // Verificar que la rutina existe
    const routine = await prisma.dayRoutine.findUnique({
      where: { id: routineId }
    })

    if (!routine) {
      return createErrorResponse('Rutina no encontrada', 404)
    }

    const exercises = await prisma.routineExercise.findMany({
      where: { routineId },
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
    })

    return createSuccessResponse(exercises)
  } catch (error) {
    console.error('Error fetching routine exercises:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}

// POST /api/routines/[id]/exercises - Agregar ejercicio a rutina
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const routineId = parseInt(params.id)

    if (isNaN(routineId)) {
      return createErrorResponse('ID de rutina inválido', 400)
    }

    const body = await request.json()
    const exerciseData = { ...body, routineId }
    const validation = routineExerciseSchema.safeParse(exerciseData)

    if (!validation.success) {
      const errors = validation.error.issues.map((issue: ZodIssue) => issue.message).join(', ')
      return createErrorResponse(errors, 400)
    }

    // Verificar que la rutina existe
    const routine = await prisma.dayRoutine.findUnique({
      where: { id: routineId }
    })

    if (!routine) {
      return createErrorResponse('Rutina no encontrada', 404)
    }

    // Verificar que el ejercicio existe
    const exercise = await prisma.exercise.findUnique({
      where: { id: validation.data.exerciseId }
    })

    if (!exercise) {
      return createErrorResponse('Ejercicio no encontrado', 404)
    }

    // Verificar que el ejercicio no esté ya en la rutina
    const existingExercise = await prisma.routineExercise.findFirst({
      where: {
        routineId,
        exerciseId: validation.data.exerciseId
      }
    })

    if (existingExercise) {
      return createErrorResponse('El ejercicio ya está en esta rutina', 409)
    }

    const newRoutineExercise = await prisma.routineExercise.create({
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

    return createSuccessResponse(newRoutineExercise, 201)
  } catch (error) {
    console.error('Error adding exercise to routine:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}