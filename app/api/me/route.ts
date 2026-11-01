import { getSessionUser } from '@/lib/auth/session'
import { AppError, errorResponse } from '@/lib/http/errors'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      throw new AppError(401, 'unauthorized', 'Faça login para continuar.')
    }

    return Response.json({ user })
  } catch (error) {
    return errorResponse(error)
  }
}
