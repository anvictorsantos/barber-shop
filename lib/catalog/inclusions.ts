const SERVICE_INCLUSIONS: Record<string, readonly string[]> = {
  'corte-barba': [
    'Corte na tesoura e máquina',
    'Barba com navalha e toalha quente',
    'Óleos essenciais',
  ],
  'corte-tesoura-maquina': ['Corte na tesoura', 'Acabamento na máquina'],
  'corte-kids': ['Corte infantil', 'Paciência com os pequenos'],
  'barba-terapia': ['Toalha quente', 'Óleos', 'Massagem relaxante'],
  barba: ['Barba com navalha', 'Finalização caprichada'],
  pezinho: ['Contorno do cabelo', 'Acabamento na nuca'],
  'progressiva-masculina': ['Alinhamento capilar térmico', 'Redução de volume e frizz'],
  'botox-capilar': ['Reconstrução capilar', 'Força e vida ao cabelo'],
}

export function serviceInclusions(slug: string): readonly string[] {
  return SERVICE_INCLUSIONS[slug] ?? []
}
