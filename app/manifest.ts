import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Barbearia do Luiz',
    short_name: 'Barbearia',
    description: 'Corte bem-feito e atendimento de verdade em Belo Horizonte.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#121110',
    theme_color: '#121110',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
