import { prisma } from '@/lib/db/prisma'
import { AppError, errorResponse } from '@/lib/http/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const upload = await prisma.upload.findUnique({ where: { id } })
    if (!upload) throw new AppError(404, 'not_found', 'Imagem não encontrada.')

    return new Response(Uint8Array.from(upload.data), {
      headers: {
        'Content-Type': upload.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
