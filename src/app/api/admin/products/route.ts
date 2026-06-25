import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

const schema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes'),
  name: z.string().min(1),
  category: z.string().default(''),
  description: z.string().default(''),
  priceUsdc: z.coerce.number().nonnegative(),
  edition: z.string().default('1 / 1'),
  inventory: z.coerce.number().int().nonnegative().default(1),
  tone: z.enum(['blue', 'pink', 'cyan']).default('blue'),
  images: z.array(z.string()).default([]),
  video: z.string().nullish(),
  active: z.boolean().default(true),
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  try {
    const created = await prisma.product.create({ data: { ...parsed.data, video: parsed.data.video ?? null } });
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: 'Could not create (is the slug unique?)' }, { status: 400 });
  }
}
