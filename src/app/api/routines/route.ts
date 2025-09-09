import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { dayRoutineSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'
import { ZodIssue } from 'zod'

// GET /api/routines - Obtener rutinas diarias
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const week = searchParams.get('week')
    const day = searchParams.get('day')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}
    if (clientId) where.clientId = clientId
    if (week) where.week = parseInt(week)
    if (day) where.day = { contains: day, mode: 'insensitive' }

    const [routines, total] = await Promise.all([
      prisma.dayRoutine.findMany({
        where,
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
        },
        skip,
        take: limit,
        orderBy: [
          { week: 'desc' },
          { day: 'asc' }
        ]
      }),
      prisma.dayRoutine.count({ where })
    ])

    return createSuccessResponse({
      routines,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching routines:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}

// POST /api/routines - Crear nueva rutina diaria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = dayRoutineSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.issues.map((issue: ZodIssue) => issue.message).join(', ')
      return createErrorResponse(errors, 400)
    }

    // Verificar si el cliente existe
    const clientExists = await prisma.user.findUnique({
      where: { id: validation.data.clientId }
    })

    if (!clientExists) {
      return createErrorResponse('Cliente no encontrado', 404)
    }

    // Verificar si ya existe una rutina para este cliente, semana y día
    const existingRoutine = await prisma.dayRoutine.findUnique({
      where: {
        clientId_week_day: {
          clientId: validation.data.clientId,
          week: validation.data.week,
          day: validation.data.day
        }
      }
    })

    if (existingRoutine) {
      return createErrorResponse('Ya existe una rutina para este cliente, semana y día', 409)
    }

    const newRoutine = await prisma.dayRoutine.create({
      data: validation.data,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        routineExercises: true
      }
    })

    return createSuccessResponse(newRoutine, 201)
  } catch (error) {
    console.error('Error creating routine:', error)
    return createErrorResponse('Error interno del servidor', 500)
  }
}