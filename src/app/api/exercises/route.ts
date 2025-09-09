import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import { exerciseSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'
import { Prisma } from '@prisma/client'
import { ZodIssue } from 'zod'

// GET /api/exercises - Obtener todos los ejercicios con filtros opcionales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const primaryMuscle = searchParams.get('primaryMuscle')
    const type = searchParams.get('type')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: Prisma.ExerciseWhereInput = {}
    
    if (primaryMuscle) {
      where.primaryMuscle = primaryMuscle
    }
    
    if (type) {
      where.type = type
    }

    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.exercise.count({ where })
    ])

    return createSuccessResponse({
      exercises,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}

// POST /api/exercises - Crear nuevo ejercicio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = exerciseSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.issues.map((issue: ZodIssue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
      return createErrorResponse(`Datos de entrada inválidos: ${errors.map(e => e.message).join(', ')}`, 400)
    }

    const { name, description, primaryMuscle, secondaryMuscles, type, difficulty, equipment, instructions, mediaUrl } = validation.data

    // Verificar si ya existe un ejercicio con el mismo nombre
    const existingExercise = await prisma.exercise.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })

    if (existingExercise) {
      return createErrorResponse('Ya existe un ejercicio con este nombre', 409)
    }

    const exercise = await prisma.exercise.create({
      data: {
        id: randomUUID(),
        name,
        description,
        primaryMuscle,
        secondaryMuscles: secondaryMuscles || [],
        type,
        difficulty: difficulty.toLowerCase() as string, // Type assertion para string
        equipment,
        instructions: instructions || [],
        mediaUrl
      }
    })

    return createSuccessResponse(exercise, 201)
  } catch (error) {
    console.error('Error creating exercise:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}