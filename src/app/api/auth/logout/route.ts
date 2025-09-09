import { createSuccessResponse } from '@/lib/utils'

export async function POST() {
  // En una implementación con JWT, el logout se maneja en el cliente
  // eliminando el token del almacenamiento local
  return createSuccessResponse({ message: 'Logout exitoso' })
}