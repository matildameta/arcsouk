import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

const schema = z.object({
  status: z.enum(['AWAITING_PAYMENT', 'PAID', 'SHIPPED', 'CANCELLED']),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  try {
    const updated = await prisma.order.update({ where: { id: params.id }, data: { status: parsed.data.status } });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Could not update order' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await prisma.order.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete order' }, { status: 400 });
  }
}
