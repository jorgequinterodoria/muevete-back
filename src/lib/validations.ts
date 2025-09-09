import { z } from 'zod'

// User validations
export const userSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['USER', 'ADMIN']).optional().default('USER')
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
})

// Exercise validations
export const exerciseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  primaryMuscle: z.string().min(1, 'El músculo primario es requerido'),
  secondaryMuscles: z.array(z.string()).optional().default([]),
  type: z.string().min(1, 'El tipo de ejercicio es requerido'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  equipment: z.string().optional(),
  instructions: z.array(z.string()).optional().default([]),
  mediaUrl: z.string().url().optional().or(z.literal(''))
})

// Exercise update schema (all fields optional except id)
export const exerciseUpdateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  description: z.string().optional(),
  primaryMuscle: z.string().min(1, 'El músculo primario es requerido').optional(),
  secondaryMuscles: z.array(z.string()).optional(),
  type: z.string().min(1, 'El tipo de ejercicio es requerido').optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  equipment: z.string().optional(),
  instructions: z.array(z.string()).optional(),
  mediaUrl: z.string().url().optional().or(z.literal(''))
})

// Routine validations
export const routineSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  difficulty_level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  duration_weeks: z.number().int().min(1, 'La duración debe ser al menos 1 semana'),
  user_id: z.string().cuid('ID de usuario inválido')
})

// Day Routine validations
export const dayRoutineSchema = z.object({
  clientId: z.string().cuid('ID de cliente inválido'),
  week: z.number().int().min(1, 'La semana debe ser al menos 1'),
  day: z.string().min(1, 'El día es requerido')
})

export const dayRoutineUpdateSchema = z.object({
  week: z.number().int().min(1, 'La semana debe ser al menos 1').optional(),
  day: z.string().min(1, 'El día es requerido').optional()
})

// Routine Exercise validations
export const routineExerciseSchema = z.object({
  routineId: z.number().int().min(1, 'ID de rutina inválido'),
  exerciseId: z.string().cuid('ID de ejercicio inválido'),
  sets: z.number().int().min(1, 'Debe tener al menos 1 serie'),
  reps: z.number().int().min(1, 'Debe tener al menos 1 repetición'),
  weight: z.number().optional(),
  rest: z.number().int().min(0, 'El descanso no puede ser negativo'),
  notes: z.string().optional(),
  completed: z.boolean().optional().default(false),
  orderIndex: z.number().int().min(0, 'El índice de orden no puede ser negativo')
})

export const routineExerciseUpdateSchema = z.object({
  sets: z.number().int().min(1, 'Debe tener al menos 1 serie').optional(),
  reps: z.number().int().min(1, 'Debe tener al menos 1 repetición').optional(),
  weight: z.number().optional(),
  rest: z.number().int().min(0, 'El descanso no puede ser negativo').optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
  orderIndex: z.number().int().min(0, 'El índice de orden no puede ser negativo').optional()
})

export type UserInput = z.infer<typeof userSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ExerciseInput = z.infer<typeof exerciseSchema>
export type ExerciseUpdateInput = z.infer<typeof exerciseUpdateSchema>
export type RoutineInput = z.infer<typeof routineSchema>
export type DayRoutineInput = z.infer<typeof dayRoutineSchema>
export type DayRoutineUpdateInput = z.infer<typeof dayRoutineUpdateSchema>
export type RoutineExerciseInput = z.infer<typeof routineExerciseSchema>
export type RoutineExerciseUpdateInput = z.infer<typeof routineExerciseUpdateSchema>