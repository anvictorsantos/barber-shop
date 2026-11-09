import { existsSync } from 'node:fs'
import path from 'node:path'

const BASE = 'https://images.unsplash.com'
const PARAMS = '?auto=format&fit=crop&w=1200&q=80'

export interface GalleryImage {
  src: string
  alt: string
}

const FALLBACK_IMAGES: GalleryImage[] = [
  {
    src: `${BASE}/photo-1503951914875-452162b0f3f1${PARAMS}`,
    alt: 'Barbeiro finalizando um corte na Barbearia do Luiz',
  },
  {
    src: `${BASE}/photo-1599351431202-1e0f0137899a${PARAMS}`,
    alt: 'Detalhe de corte masculino feito com tesoura',
  },
  {
    src: `${BASE}/photo-1517832606299-7ae9b720a186${PARAMS}`,
    alt: 'Barba sendo alinhada com navalha',
  },
  {
    src: `${BASE}/photo-1593702288056-7927b442d0fa${PARAMS}`,
    alt: 'Cliente e barbeiro durante o atendimento',
  },
  {
    src: `${BASE}/photo-1622286342621-4bd786c2447c${PARAMS}`,
    alt: 'Acabamento do contorno do cabelo',
  },
  {
    src: `${BASE}/photo-1621605815971-fbc98d665033${PARAMS}`,
    alt: 'Cuidado com o cabelo na cadeira da barbearia',
  },
]

const LOCAL_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const

function localPhoto(index: number): string | null {
  const name = String(index + 1).padStart(2, '0')

  for (const extension of LOCAL_EXTENSIONS) {
    const publicPath = `/galeria/${name}.${extension}`
    if (existsSync(path.join(process.cwd(), 'public', publicPath))) return publicPath
  }

  return null
}

export const GALLERY_IMAGES: GalleryImage[] = FALLBACK_IMAGES.map((image, index) => ({
  ...image,
  src: localPhoto(index) ?? image.src,
}))
