import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  priceUsdc: z.coerce.number().nonnegative().optional(),
  edition: z.string().optional(),
  inventory: z.coerce.number().int().nonnegative().optional(),
  tone: z.enum(['blue', 'pink', 'cyan']).optional(),
  images: z.array(z.string()).optional(),
  video: z.string().nullish(),
  active: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  try {
    const updated = await prisma.product.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Could not update' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete' }, { status: 400 });
  }
}
