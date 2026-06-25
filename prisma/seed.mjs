// Seed Arc Souk with the starter collection. Run: npm run db:seed
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  { slug: 'monolith-no-7', name: 'Monolith No. 7', category: 'Gypsum · hand-finished', priceUsdc: 240, edition: '1 / 12', inventory: 12, tone: 'blue', description: 'A hand-cast gypsum monolith finished over four days. Matte body, polished edge, a single edition of twelve.' },
  { slug: 'aperture', name: 'Aperture', category: 'Plaster · pigment wash', priceUsdc: 180, edition: '1 / 8', inventory: 8, tone: 'pink', description: 'Plaster with a hand-rubbed pigment wash that pools in the recesses. Each one drinks the pigment differently.' },
  { slug: 'veil-study', name: 'Veil Study', category: 'Gypsum · unique', priceUsdc: 320, edition: '1 / 1', inventory: 1, tone: 'cyan', description: 'A unique study in folded gypsum — one of one, never repeated.' },
  { slug: 'cast-shadow', name: 'Cast Shadow', category: 'Plaster · charcoal', priceUsdc: 210, edition: '1 / 10', inventory: 10, tone: 'blue', description: 'Charcoal-tinted plaster that reads differently as the light moves around it.' },
  { slug: 'lumen', name: 'Lumen', category: 'Gypsum · pearl finish', priceUsdc: 280, edition: '1 / 6', inventory: 6, tone: 'cyan', description: 'A pearl-finished gypsum form that catches and scatters light along its curve.' },
  { slug: 'meridian', name: 'Meridian', category: 'Plaster · unique', priceUsdc: 360, edition: '1 / 1', inventory: 1, tone: 'pink', description: 'A single, sweeping plaster arc — the studio signature form, made once.' },
];

async function main() {
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...p, images: [] },
      create: { ...p, images: [] },
    });
  }
  await prisma.contentBlock.upsert({
    where: { key: 'home_banner' },
    update: {},
    create: { key: 'home_banner', title: '', body: '', enabled: false },
  });
  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
