import { getSessionUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { AppError, errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'
import { imageMimeType, MAX_UPLOAD_BYTES } from '@/lib/uploads/image'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = MAX_UPLOAD_BYTES + 1024 * 1024

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)

    const user = await getSessionUser()
    if (!user || user.role === 'CUSTOMER') {
      throw new AppError(401, 'unauthorized', 'Sessão inválida.')
    }

    if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
      throw new AppError(413, 'file_too_large', 'A imagem deve ter no máximo 2 MB.')
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw new AppError(400, 'file_missing', 'Escolha uma imagem.')
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new AppError(413, 'file_too_large', 'A imagem deve ter no máximo 2 MB.')
    }

    const data = new Uint8Array(await file.arrayBuffer())
    const mimeType = imageMimeType(data)
    if (!mimeType) {
      throw new AppError(415, 'invalid_file', 'Envie uma imagem JPEG, PNG, WebP ou GIF.')
    }

    const upload = await prisma.upload.create({ data: { data, mimeType } })
    return Response.json({ url: `/api/uploads/${upload.id}` }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
