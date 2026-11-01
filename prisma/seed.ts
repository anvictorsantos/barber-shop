import { hash } from '@node-rs/argon2'
import {
  PrismaClient,
  type AppointmentSource,
  type AppointmentStatus,
  type OrderStatus,
  type PaymentMethod,
} from '@prisma/client'
import { addDays, format, getDay, parseISO } from 'date-fns'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

const prisma = new PrismaClient()
const TIMEZONE = 'America/Sao_Paulo'
const DEMO_PASSWORD = 'demo1234'

type BookingSeed = {
  dayOffset: number
  time: string
  barber: 'luiz' | 'hinner' | 'carlos'
  service: string
  customer: string | null
  customerName?: string
  customerPhone?: string
  status: AppointmentStatus
  source?: AppointmentSource
  payment: 'online' | 'onsite' | 'none'
  method?: PaymentMethod
}

const todayDate = parseISO(formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd'))

function businessDate(offset: number): string {
  let cursor = todayDate

  if (offset === 0) {
    while (getDay(cursor) === 0) cursor = addDays(cursor, 1)
  } else {
    let remaining = Math.abs(offset)
    const step = offset > 0 ? 1 : -1

    while (remaining > 0) {
      cursor = addDays(cursor, step)
      if (getDay(cursor) !== 0) remaining -= 1
    }
  }

  while (getDay(cursor) === 0) cursor = addDays(cursor, 1)
  return format(cursor, 'yyyy-MM-dd')
}

function at(dayOffset: number, time: string): Date {
  return fromZonedTime(`${businessDate(dayOffset)} ${time}:00`, TIMEZONE)
}

const serviceSeeds = [
  {
    slug: 'corte-barba',
    name: 'Corte + Barba',
    description:
      'O combo clássico para o homem moderno. Inclui corte de cabelo personalizado e design completo da barba com navalha, toalha quente e óleos essenciais.',
    category: 'COMBO',
    durationMin: 40,
    priceCents: 6000,
    originalPriceCents: 7000,
    promoLabel: 'PROMO COMBO',
    sortOrder: 0,
  },
  {
    slug: 'corte-tesoura-maquina',
    name: 'Corte Tesoura + Máquina',
    description:
      'Corte de cabelo personalizado combinando técnicas clássicas de tesoura e máquina.',
    category: 'CORTE',
    durationMin: 30,
    priceCents: 4500,
    sortOrder: 1,
  },
  {
    slug: 'corte-kids',
    name: 'Corte Kids',
    description: 'Corte infantil cuidadoso e divertido para deixar os pequenos no estilo.',
    category: 'CORTE',
    durationMin: 25,
    priceCents: 4500,
    sortOrder: 2,
  },
  {
    slug: 'barba-terapia',
    name: 'Barba Terapia',
    description: 'Tratamento facial completo com toalhas quentes, óleos essenciais e massagem.',
    category: 'BARBA',
    durationMin: 35,
    priceCents: 4500,
    sortOrder: 3,
  },
  {
    slug: 'barba',
    name: 'Barba',
    description: 'Alinhamento clássico de barba, navalha e finalização com balm premium.',
    category: 'BARBA',
    durationMin: 20,
    priceCents: 3500,
    sortOrder: 4,
  },
  {
    slug: 'pezinho',
    name: 'Pezinho',
    description: 'Limpeza de contorno do cabelo para manter o corte em dia.',
    category: 'PEZINHO',
    durationMin: 10,
    priceCents: 1000,
    sortOrder: 5,
  },
  {
    slug: 'progressiva-masculina',
    name: 'Progressiva Masculina',
    description: 'Alinhamento capilar térmico para redução de volume e frizz.',
    category: 'QUIMICA',
    durationMin: 90,
    priceCents: 6000,
    sortOrder: 6,
  },
  {
    slug: 'botox-capilar',
    name: 'Botox Capilar',
    description: 'Tratamento profundo de reconstrução dos fios capilares.',
    category: 'QUIMICA',
    durationMin: 60,
    priceCents: 7000,
    sortOrder: 7,
  },
  {
    slug: 'relaxamento',
    name: 'Relaxamento',
    description: 'Tratamento químico para controle e texturização de cabelos cacheados.',
    category: 'QUIMICA',
    durationMin: 45,
    priceCents: 6000,
    active: false,
    sortOrder: 8,
  },
] as const

const productSeeds = [
  {
    slug: 'pomada-modeladora-matte',
    name: 'Pomada Modeladora Matte',
    description: 'Fixação forte com acabamento seco.',
    priceCents: 3500,
    stock: 15,
  },
  {
    slug: 'oleo-pos-barba-eucalyptus',
    name: 'Óleo Pós-Barba Eucalyptus',
    description: 'Acalma e hidrata após a barba.',
    priceCents: 2800,
    stock: 8,
  },
  {
    slug: 'locao-pos-barba-shave',
    name: 'Loção Pós-Barba Shave',
    description: 'Loção refrescante para o pós-barba.',
    priceCents: 3000,
    stock: 12,
  },
  {
    slug: 'cerveja-stella-artois',
    name: 'Cerveja Gelada Stella Artois',
    description: 'Cerveja gelada para acompanhar o corte.',
    priceCents: 800,
    stock: 48,
  },
] as const

const bookingSeeds: BookingSeed[] = [
  {
    dayOffset: -2,
    time: '09:00',
    barber: 'luiz',
    service: 'corte-barba',
    customer: 'joao',
    status: 'COMPLETED',
    payment: 'onsite',
    method: 'CASH',
  },
  {
    dayOffset: -2,
    time: '10:30',
    barber: 'hinner',
    service: 'corte-tesoura-maquina',
    customer: 'felipe',
    status: 'COMPLETED',
    payment: 'online',
    method: 'PIX',
  },
  {
    dayOffset: -2,
    time: '14:00',
    barber: 'carlos',
    service: 'barba',
    customer: 'andre',
    status: 'COMPLETED',
    payment: 'onsite',
    method: 'CREDIT_CARD',
  },
  {
    dayOffset: -1,
    time: '09:00',
    barber: 'luiz',
    service: 'corte-kids',
    customer: 'mateus',
    status: 'COMPLETED',
    payment: 'onsite',
    method: 'CASH',
  },
  {
    dayOffset: -1,
    time: '11:15',
    barber: 'hinner',
    service: 'barba-terapia',
    customer: 'gabriel',
    status: 'COMPLETED',
    payment: 'online',
    method: 'PIX',
  },
  {
    dayOffset: -1,
    time: '16:00',
    barber: 'carlos',
    service: 'progressiva-masculina',
    customer: 'thiago',
    status: 'COMPLETED',
    payment: 'online',
    method: 'CREDIT_CARD',
  },
  {
    dayOffset: -1,
    time: '14:00',
    barber: 'luiz',
    service: 'pezinho',
    customer: 'lucas',
    status: 'COMPLETED',
    payment: 'onsite',
    method: 'CASH',
  },
  {
    dayOffset: 0,
    time: '09:00',
    barber: 'luiz',
    service: 'corte-barba',
    customer: 'joao',
    status: 'CONFIRMED',
    payment: 'online',
    method: 'PIX',
  },
  {
    dayOffset: 0,
    time: '10:30',
    barber: 'hinner',
    service: 'corte-tesoura-maquina',
    customer: 'rafael',
    status: 'PENDING',
    payment: 'none',
  },
  {
    dayOffset: 0,
    time: '11:15',
    barber: 'carlos',
    service: 'barba',
    customer: 'bruno',
    status: 'CONFIRMED',
    payment: 'online',
    method: 'CREDIT_CARD',
  },
  {
    dayOffset: 0,
    time: '14:00',
    barber: 'luiz',
    service: 'barba-terapia',
    customer: 'pedro',
    status: 'CONFIRMED',
    payment: 'online',
    method: 'PIX',
  },
  {
    dayOffset: 0,
    time: '15:30',
    barber: 'carlos',
    service: 'progressiva-masculina',
    customer: 'arthur',
    status: 'CANCELED',
    payment: 'none',
  },
  {
    dayOffset: 0,
    time: '18:00',
    barber: 'luiz',
    service: 'corte-tesoura-maquina',
    customer: null,
    customerName: 'Cliente Walk-in',
    customerPhone: '+5531999990000',
    status: 'CONFIRMED',
    source: 'WALK_IN',
    payment: 'none',
  },
  {
    dayOffset: 1,
    time: '10:30',
    barber: 'carlos',
    service: 'corte-kids',
    customer: 'felipe',
    status: 'PENDING',
    payment: 'none',
  },
  {
    dayOffset: 1,
    time: '16:00',
    barber: 'luiz',
    service: 'corte-tesoura-maquina',
    customer: 'mateus',
    status: 'CANCELED',
    payment: 'none',
  },
  {
    dayOffset: 2,
    time: '09:00',
    barber: 'hinner',
    service: 'barba-terapia',
    customer: 'gabriel',
    status: 'CONFIRMED',
    payment: 'online',
    method: 'CREDIT_CARD',
  },
  {
    dayOffset: 2,
    time: '14:00',
    barber: 'carlos',
    service: 'botox-capilar',
    customer: 'thiago',
    status: 'CONFIRMED',
    payment: 'online',
    method: 'PIX',
  },
  {
    dayOffset: 2,
    time: '10:30',
    barber: 'luiz',
    service: 'corte-barba',
    customer: 'andre',
    status: 'NO_SHOW',
    payment: 'none',
  },
  {
    dayOffset: 3,
    time: '11:00',
    barber: 'luiz',
    service: 'corte-tesoura-maquina',
    customer: 'lucas',
    status: 'PENDING',
    payment: 'none',
  },
  {
    dayOffset: 3,
    time: '15:00',
    barber: 'hinner',
    service: 'pezinho',
    customer: 'bruno',
    status: 'CONFIRMED',
    payment: 'online',
    method: 'PIX',
  },
]

let orderCounter = 1000
function nextCode(): string {
  orderCounter += 1
  return `BL-${orderCounter}`
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE !== 'true') {
    throw new Error(
      'Refusing to seed demo data in production. Set DEMO_MODE=true on a demo environment.',
    )
  }

  await prisma.$transaction([
    prisma.refund.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.loyaltyEntry.deleteMany(),
    prisma.loyaltyCredit.deleteMany(),
    prisma.review.deleteMany(),
    prisma.orderProduct.deleteMany(),
    prisma.inventoryMovement.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.favoriteBarber.deleteMany(),
    prisma.favoriteService.deleteMany(),
    prisma.favoriteProduct.deleteMany(),
    prisma.session.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.loyaltyAccount.deleteMany(),
    prisma.notificationLog.deleteMany(),
    prisma.timeBlock.deleteMany(),
    prisma.shopHours.deleteMany(),
    prisma.product.deleteMany(),
    prisma.service.deleteMany(),
    prisma.barberProfile.deleteMany(),
    prisma.user.deleteMany(),
    prisma.shop.deleteMany(),
  ])

  await prisma.shop.create({
    data: {
      name: 'Barbearia do Luiz',
      addressLine: 'Rua dos Geólogos, 698 — Alípio de Melo',
      city: 'Belo Horizonte',
      state: 'MG',
      phone: '+5531988815243',
      whatsapp: '+5531988815243',
      email: 'contato@barbeariadoluiz.com.br',
      timezone: TIMEZONE,
    },
  })

  const passwordHash = await hash(DEMO_PASSWORD)
  const verifiedAt = new Date()

  const owner = await prisma.user.create({
    data: {
      name: 'Luiz Silva',
      email: 'luiz@barbeariadoluiz.com.br',
      emailVerifiedAt: verifiedAt,
      phone: '+5531988815243',
      phoneVerifiedAt: verifiedAt,
      passwordHash,
      role: 'OWNER',
    },
  })

  const hinnerUser = await prisma.user.create({
    data: {
      name: 'Hinner Santos',
      email: 'hinner@barbeariadoluiz.com.br',
      emailVerifiedAt: verifiedAt,
      phone: '+5531987654321',
      phoneVerifiedAt: verifiedAt,
      passwordHash,
      role: 'BARBER',
    },
  })

  const carlosUser = await prisma.user.create({
    data: {
      name: 'Carlos Heitor',
      email: 'carlos@barbeariadoluiz.com.br',
      emailVerifiedAt: verifiedAt,
      phone: '+5531987654322',
      phoneVerifiedAt: verifiedAt,
      passwordHash,
      role: 'BARBER',
    },
  })

  const customerSeeds = [
    ['joao', 'João Silva', 'joao.silva@example.com', '+5531998765432'],
    ['felipe', 'Felipe Andrade', 'felipe.andrade@example.com', '+5531998765433'],
    ['andre', 'André Souza', 'andre.souza@example.com', '+5531998765434'],
    ['mateus', 'Mateus Lima', 'mateus.lima@example.com', '+5531998765435'],
    ['gabriel', 'Gabriel Barbosa', 'gabriel.barbosa@example.com', '+5531998765436'],
    ['thiago', 'Thiago Martins', 'thiago.martins@example.com', '+5531998765437'],
    ['lucas', 'Lucas Pereira', 'lucas.pereira@example.com', '+5531998765438'],
    ['rafael', 'Rafael Costa', 'rafael.costa@example.com', '+5531998765439'],
    ['bruno', 'Bruno Oliveira', 'bruno.oliveira@example.com', '+5531998765440'],
    ['pedro', 'Pedro Santos', 'pedro.santos@example.com', '+5531998765441'],
    ['arthur', 'Arthur Pendragon', 'arthur.pendragon@example.com', '+5531998765442'],
  ] as const

  const customers: Record<
    string,
    { id: string; name: string; email: string | null; phone: string | null }
  > = {}

  for (const [key, name, email, phone] of customerSeeds) {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        emailVerifiedAt: verifiedAt,
        phone,
        phoneVerifiedAt: verifiedAt,
        passwordHash,
        role: 'CUSTOMER',
        ...(key === 'arthur'
          ? { noShowCount: 3, bookingBlocked: true, blockedAt: verifiedAt }
          : {}),
      },
    })
    customers[key] = { id: user.id, name: user.name, email: user.email, phone: user.phone }
  }

  const luiz = await prisma.barberProfile.create({
    data: {
      userId: owner.id,
      displayName: 'Luiz Silva',
      title: 'Proprietário / Master Barber',
      avatarUrl: 'https://placehold.co/128x128/1C1D22/EAA83A?text=Luiz',
      sortOrder: 0,
      ratingAvg: 5,
      ratingCount: 240,
    },
  })

  const hinner = await prisma.barberProfile.create({
    data: {
      userId: hinnerUser.id,
      displayName: 'Hinner Santos',
      title: 'Barbeiro Sênior',
      avatarUrl: 'https://placehold.co/128x128/1C1D22/EAA83A?text=Hinner',
      sortOrder: 1,
      ratingAvg: 4.9,
      ratingCount: 180,
    },
  })

  const carlos = await prisma.barberProfile.create({
    data: {
      userId: carlosUser.id,
      displayName: 'Carlos Heitor',
      title: 'Barbeiro Sênior',
      avatarUrl: 'https://placehold.co/128x128/1C1D22/EAA83A?text=Carlos',
      sortOrder: 2,
      ratingAvg: 4.8,
      ratingCount: 120,
    },
  })

  const barbers = { luiz, hinner, carlos }

  const services: Record<
    string,
    { id: string; slug: string; durationMin: number; priceCents: number }
  > = {}
  for (const seed of serviceSeeds) {
    const service = await prisma.service.create({
      data: {
        ...seed,
        imageUrl: `https://placehold.co/600x400/1C1D22/EAA83A?text=${encodeURIComponent(seed.name)}`,
      },
    })
    services[service.slug] = {
      id: service.id,
      slug: service.slug,
      durationMin: service.durationMin,
      priceCents: service.priceCents,
    }
  }

  const products: Record<string, { id: string; slug: string; priceCents: number }> = {}
  for (const seed of productSeeds) {
    const product = await prisma.product.create({
      data: {
        ...seed,
        imageUrl: `https://placehold.co/400x400/1C1D22/EAA83A?text=${encodeURIComponent(seed.name)}`,
      },
    })
    products[product.slug] = { id: product.id, slug: product.slug, priceCents: product.priceCents }
  }

  await prisma.shopHours.createMany({
    data: [
      { weekday: 0, openMinute: 0, closeMinute: 0, closed: true },
      { weekday: 1, openMinute: 540, closeMinute: 1200 },
      { weekday: 2, openMinute: 540, closeMinute: 1200 },
      { weekday: 3, openMinute: 540, closeMinute: 1200 },
      { weekday: 4, openMinute: 540, closeMinute: 1200 },
      { weekday: 5, openMinute: 540, closeMinute: 1200 },
      { weekday: 6, openMinute: 540, closeMinute: 1080 },
    ],
  })

  await prisma.timeBlock.createMany({
    data: Object.values(barbers).flatMap((barber) =>
      [1, 2, 3, 4, 5, 6].map((weekday) => ({
        barberId: barber.id,
        label: 'Intervalo de Almoço - Diário',
        recurring: true,
        weekday,
        startMinute: 720,
        endMinute: 810,
      })),
    ),
  })

  await prisma.timeBlock.create({
    data: {
      barberId: carlos.id,
      label: 'Manutenção de Cadeiras',
      recurring: false,
      date: parseISO(businessDate(2)),
      startMinute: 900,
      endMinute: 960,
    },
  })

  async function createBooking(input: BookingSeed) {
    const service = services[input.service]
    const barber = barbers[input.barber]
    if (!service) throw new Error(`Unknown service: ${input.service}`)
    if (!barber) throw new Error(`Unknown barber: ${input.barber}`)

    const customer = input.customer ? customers[input.customer] : null
    const startAt = at(input.dayOffset, input.time)
    const endAt = new Date(startAt.getTime() + service.durationMin * 60_000)
    const paid = input.payment !== 'none'
    const orderStatus: OrderStatus = paid
      ? 'PAID'
      : input.status === 'CANCELED' || input.status === 'CANCELED_LATE'
        ? 'CANCELED'
        : 'OPEN'

    const code = nextCode()
    const order = await prisma.order.create({
      data: {
        code,
        customerId: customer?.id ?? null,
        customerName: input.customerName ?? customer?.name ?? 'Cliente',
        customerPhone: input.customerPhone ?? customer?.phone ?? null,
        customerEmail: customer?.email ?? null,
        status: orderStatus,
        paymentMode: input.payment === 'online' ? 'ONLINE' : 'ON_SITE',
        serviceCents: service.priceCents,
        productCents: 0,
        creditCents: 0,
        totalCents: service.priceCents,
        paidAt: paid ? new Date() : null,
        canceledAt: orderStatus === 'CANCELED' ? new Date() : null,
      },
    })

    const appointment = await prisma.appointment.create({
      data: {
        orderId: order.id,
        customerId: customer?.id ?? null,
        barberId: barber.id,
        serviceId: service.id,
        startAt,
        endAt,
        status: input.status,
        source: input.source ?? 'ONLINE',
        priceCents: service.priceCents,
        createdById: input.source === 'WALK_IN' ? owner.id : null,
        canceledAt:
          input.status === 'CANCELED' || input.status === 'CANCELED_LATE' ? new Date() : null,
        completedAt: input.status === 'COMPLETED' ? endAt : null,
        noShowAt: input.status === 'NO_SHOW' ? startAt : null,
      },
    })

    if (paid) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          appointmentId: input.payment === 'onsite' ? appointment.id : null,
          provider: input.payment === 'online' ? 'MERCADO_PAGO' : 'MANUAL',
          providerPaymentId: input.payment === 'online' ? `seed_${order.code}` : null,
          method: input.method ?? 'PIX',
          status: 'PAID',
          amountCents: service.priceCents,
          refundedCents: 0,
          paidAt: new Date(),
        },
      })
    }

    return appointment
  }

  const createdAppointments: Awaited<ReturnType<typeof createBooking>>[] = []
  for (const seed of bookingSeeds) {
    createdAppointments.push(await createBooking(seed))
  }

  const multiLineCode = nextCode()
  const multiStartOne = at(1, '09:00')
  const multiStartTwo = at(1, '10:30')
  const multiServiceOne = services['corte-barba']
  const multiServiceTwo = services['barba']
  if (!multiServiceOne || !multiServiceTwo) throw new Error('Missing multi-line services')

  const multiTotal = multiServiceOne.priceCents + multiServiceTwo.priceCents
  const multiOrder = await prisma.order.create({
    data: {
      code: multiLineCode,
      customerId: customers['joao']?.id ?? null,
      customerName: customers['joao']?.name ?? 'João Silva',
      customerPhone: customers['joao']?.phone ?? null,
      customerEmail: customers['joao']?.email ?? null,
      status: 'PAID',
      paymentMode: 'ONLINE',
      serviceCents: multiTotal,
      productCents: 0,
      creditCents: 0,
      totalCents: multiTotal,
      paidAt: new Date(),
    },
  })

  await prisma.appointment.create({
    data: {
      orderId: multiOrder.id,
      customerId: customers['joao']?.id ?? null,
      barberId: luiz.id,
      serviceId: multiServiceOne.id,
      startAt: multiStartOne,
      endAt: new Date(multiStartOne.getTime() + multiServiceOne.durationMin * 60_000),
      status: 'CONFIRMED',
      source: 'ONLINE',
      priceCents: multiServiceOne.priceCents,
    },
  })

  await prisma.appointment.create({
    data: {
      orderId: multiOrder.id,
      customerId: customers['joao']?.id ?? null,
      barberId: hinner.id,
      serviceId: multiServiceTwo.id,
      startAt: multiStartTwo,
      endAt: new Date(multiStartTwo.getTime() + multiServiceTwo.durationMin * 60_000),
      status: 'CONFIRMED',
      source: 'ONLINE',
      priceCents: multiServiceTwo.priceCents,
    },
  })

  await prisma.payment.create({
    data: {
      orderId: multiOrder.id,
      appointmentId: null,
      provider: 'MERCADO_PAGO',
      providerPaymentId: `seed_${multiOrder.code}`,
      method: 'PIX',
      status: 'PAID',
      amountCents: multiTotal,
      refundedCents: 0,
      paidAt: new Date(),
    },
  })

  const productOrderCode = nextCode()
  const pomada = products['pomada-modeladora-matte']
  const cerveja = products['cerveja-stella-artois']
  if (!pomada || !cerveja) throw new Error('Missing seed products')

  const productTotal = pomada.priceCents + cerveja.priceCents * 2
  const productOrder = await prisma.order.create({
    data: {
      code: productOrderCode,
      customerId: customers['joao']?.id ?? null,
      customerName: customers['joao']?.name ?? 'João Silva',
      customerPhone: customers['joao']?.phone ?? null,
      customerEmail: customers['joao']?.email ?? null,
      status: 'PAID',
      paymentMode: 'ONLINE',
      serviceCents: 0,
      productCents: productTotal,
      creditCents: 0,
      totalCents: productTotal,
      paidAt: new Date(),
    },
  })

  await prisma.orderProduct.createMany({
    data: [
      {
        orderId: productOrder.id,
        productId: pomada.id,
        quantity: 1,
        unitPriceCents: pomada.priceCents,
        lineTotalCents: pomada.priceCents,
      },
      {
        orderId: productOrder.id,
        productId: cerveja.id,
        quantity: 2,
        unitPriceCents: cerveja.priceCents,
        lineTotalCents: cerveja.priceCents * 2,
      },
    ],
  })

  await prisma.payment.create({
    data: {
      orderId: productOrder.id,
      appointmentId: null,
      provider: 'MERCADO_PAGO',
      providerPaymentId: `seed_${productOrder.code}`,
      method: 'PIX',
      status: 'PAID',
      amountCents: productTotal,
      refundedCents: 0,
      paidAt: new Date(),
    },
  })

  await prisma.inventoryMovement.createMany({
    data: [
      { productId: pomada.id, orderId: productOrder.id, type: 'SALE', quantity: 1, note: 'Seed' },
      { productId: cerveja.id, orderId: productOrder.id, type: 'SALE', quantity: 2, note: 'Seed' },
    ],
  })

  const completed = createdAppointments.filter(
    (appointment) => appointment.status === 'COMPLETED' && appointment.customerId,
  )
  const ratings = [5, 5, 4]

  for (const [index, appointment] of completed.slice(0, ratings.length).entries()) {
    const rating = ratings[index]
    if (!rating || !appointment.customerId) continue
    await prisma.review.create({
      data: {
        appointmentId: appointment.id,
        customerId: appointment.customerId,
        barberId: appointment.barberId,
        rating,
        comment: index === 0 ? 'Atendimento impecável.' : null,
      },
    })
  }

  await prisma.barberProfile.update({
    where: { id: luiz.id },
    data: { ratingAvg: 5, ratingCount: 240 },
  })
  await prisma.barberProfile.update({
    where: { id: hinner.id },
    data: { ratingAvg: 4.9, ratingCount: 180 },
  })
  await prisma.barberProfile.update({
    where: { id: carlos.id },
    data: { ratingAvg: 4.8, ratingCount: 120 },
  })

  const joao = customers['joao']
  if (joao) {
    const loyalty = await prisma.loyaltyAccount.create({
      data: { userId: joao.id, stamps: 12, lifetimeVisits: 12, tier: 'GOLD' },
    })
    await prisma.loyaltyEntry.createMany({
      data: Array.from({ length: 12 }, (_, index) => ({
        accountId: loyalty.id,
        type: 'STAMP' as const,
        deltaStamps: 1,
        note: `Seed stamp ${index + 1}`,
      })),
    })

    await prisma.favoriteBarber.create({ data: { userId: joao.id, barberId: luiz.id } })
    const favoriteService = services['corte-barba']
    const favoriteProduct = products['pomada-modeladora-matte']
    if (favoriteService) {
      await prisma.favoriteService.create({
        data: { userId: joao.id, serviceId: favoriteService.id },
      })
    }
    if (favoriteProduct) {
      await prisma.favoriteProduct.create({
        data: { userId: joao.id, productId: favoriteProduct.id },
      })
    }
  }

  const felipe = customers['felipe']
  if (felipe) {
    const loyalty = await prisma.loyaltyAccount.create({
      data: { userId: felipe.id, stamps: 5, lifetimeVisits: 5, tier: 'BRONZE' },
    })
    await prisma.loyaltyEntry.createMany({
      data: Array.from({ length: 5 }, (_, index) => ({
        accountId: loyalty.id,
        type: 'STAMP' as const,
        deltaStamps: 1,
        note: `Seed stamp ${index + 1}`,
      })),
    })
  }

  console.log('Seed complete', {
    services: serviceSeeds.length,
    products: productSeeds.length,
    barbers: Object.keys(barbers).length,
    customers: customerSeeds.length,
    appointments: createdAppointments.length + 2,
    orders: orderCounter - 1000,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
