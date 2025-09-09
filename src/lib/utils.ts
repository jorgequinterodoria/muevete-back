import { NextResponse } from 'next/server'

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function createSuccessResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status })
}

export function validateRequiredFields(data: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (!data[field]) {
      return `El campo ${field} es requerido`
    }
  }
  return null
}

export function sanitizeUser(user: Record<string, unknown>) {
  const { password, ...sanitizedUser } = user
  return sanitizedUser
}