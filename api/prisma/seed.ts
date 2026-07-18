import { PrismaClient, Currency } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Tags
  const electronics = await prisma.tag.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics', color: '#8B5CF6' },
  })
  const gaming = await prisma.tag.upsert({
    where: { name: 'Gaming' },
    update: {},
    create: { name: 'Gaming', color: '#06B6D4' },
  })
  const gpu = await prisma.tag.upsert({
    where: { name: 'GPU' },
    update: {},
    create: { name: 'GPU', color: '#F59E0B' },
  })

  // Item 1: RTX 4090
  const rtx = await prisma.item.upsert({
    where: { id: 'seed-item-rtx4090' },
    update: {},
    create: {
      id: 'seed-item-rtx4090',
      name: 'NVIDIA RTX 4090 Founders Edition',
      imageUrl: null,
      isFavorite: true,
      tags: {
        create: [
          { tag: { connect: { id: electronics.id } } },
          { tag: { connect: { id: gaming.id } } },
          { tag: { connect: { id: gpu.id } } },
        ],
      },
    },
  })

  const amazonSource = await prisma.source.upsert({
    where: { id: 'seed-src-rtx-amazon' },
    update: {},
    create: {
      id: 'seed-src-rtx-amazon',
      itemId: rtx.id,
      url: 'https://amazon.com/nvidia-rtx-4090',
      currency: Currency.USD,
      priceClass: 'a-price-whole',
      fatherClass: 'a-price',
      isMain: true,
      currentPrice: 1599.99,
      lastScrapedAt: new Date(),
    },
  })

  const neweggSource = await prisma.source.upsert({
    where: { id: 'seed-src-rtx-newegg' },
    update: {},
    create: {
      id: 'seed-src-rtx-newegg',
      itemId: rtx.id,
      url: 'https://newegg.com/nvidia-rtx-4090',
      currency: Currency.USD,
      cssRule: '.price-current strong',
      isMain: false,
      currentPrice: 1649.88,
      lastScrapedAt: new Date(),
    },
  })

  // Seed 30 days of price history for both sources
  const now = Date.now()
  const day = 86_400_000
  for (let i = 29; i >= 0; i--) {
    const scrapedAt = new Date(now - i * day)
    await prisma.priceHistory.createMany({
      data: [
        {
          sourceId: amazonSource.id,
          price: 1599.99 + (Math.random() - 0.5) * 80,
          scrapedAt,
        },
        {
          sourceId: neweggSource.id,
          price: 1649.88 + (Math.random() - 0.5) * 60,
          scrapedAt,
        },
      ],
      skipDuplicates: true,
    })
  }

  console.log('Seed complete ✓')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())