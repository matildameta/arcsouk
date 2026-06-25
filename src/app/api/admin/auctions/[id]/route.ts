import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auctionTable } from '@/lib/store';
import { requireAdmin } from '@/lib/session';

const schema = z.object({
  auctionId: z.number().int().optional(),
  tokenId: z.number().int().optional(),
  txHash: z.string().optional(),
  endTime: z.string().optional(),
  status: z.enum(['DRAFT', 'LIVE', 'SETTLED', 'CANCELLED']).optional(),
  winner: z.string().optional(),
  winAmount: z.number().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { endTime, ...rest } = parsed.data;
  try {
    const a = await auctionTable().update({
      where: { id: params.id },
      data: { ...rest, ...(endTime ? { endTime: new Date(endTime) } : {}) },
    });
    return NextResponse.json(a);
  } catch {
    return NextResponse.json({ error: 'Could not update auction' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await auctionTable().delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete auction' }, { status: 400 });
  }
}
