import { hash } from '@node-rs/argon2'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const PASSWORD = 'demo1234'

async function main() {
  const passwordHash = await hash(PASSWORD)
  const verifiedAt = new Date()

  const luiz = await prisma.user.upsert({
    where: { email: 'luiz@barbeariadoluiz.com.br' },
    update: { passwordHash, emailVerifiedAt: verifiedAt, role: 'OWNER' },
    create: {
      name: 'Luiz Silva',
      email: 'luiz@barbeariadoluiz.com.br',
      emailVerifiedAt: verifiedAt,
      phone: '+5531988815243',
      phoneVerifiedAt: verifiedAt,
      passwordHash,
      role: 'OWNER',
    },
  })

  const antonio = await prisma.user.upsert({
    where: { email: 'antonio@barbeariadoluiz.com.br' },
    update: { passwordHash, emailVerifiedAt: verifiedAt, role: 'BARBER' },
    create: {
      name: 'Antonio Pontes',
      email: 'antonio@barbeariadoluiz.com.br',
      emailVerifiedAt: verifiedAt,
      phone: '+5531999990001',
      phoneVerifiedAt: verifiedAt,
      passwordHash,
      role: 'BARBER',
    },
  })

  await prisma.barberProfile.upsert({
    where: { userId: antonio.id },
    update: { displayName: 'Antonio Pontes', active: true },
    create: {
      userId: antonio.id,
      displayName: 'Antonio Pontes',
      title: 'Barbeiro',
      sortOrder: 9,
    },
  })

  const joao = await prisma.user.upsert({
    where: { email: 'joao@barbeariadoluiz.com.br' },
    update: { passwordHash, emailVerifiedAt: verifiedAt, role: 'CUSTOMER' },
    create: {
      name: 'João Silva',
      email: 'joao@barbeariadoluiz.com.br',
      emailVerifiedAt: verifiedAt,
      phone: '+5531999990002',
      phoneVerifiedAt: verifiedAt,
      passwordHash,
      role: 'CUSTOMER',
    },
  })

  console.log(JSON.stringify({ luiz, antonio, joao }, null, 2))
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
