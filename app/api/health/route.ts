export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({
    status: 'ok',
    service: 'barbearia-do-luiz',
    time: new Date().toISOString(),
  })
}
