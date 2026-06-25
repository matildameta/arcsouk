import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

const schema = z.object({
  key: z.string().min(1),
  title: z.string().optional(),
  body: z.string().optional(),
  image: z.string().optional(),
  enabled: z.boolean().optional(),
});

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { key, ...rest } = parsed.data;
  try {
    const block = await prisma.contentBlock.upsert({
      where: { key },
      update: rest,
      create: { key, ...rest },
    });
    return NextResponse.json(block);
  } catch {
    return NextResponse.json({ error: 'Could not save block' }, { status: 400 });
  }
}
