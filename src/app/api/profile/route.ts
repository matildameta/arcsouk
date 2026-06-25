import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

const schema = z.object({
  name: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  shippingAddress: z.string().max(300).optional(),
  walletAddress: z.string().max(60).optional(),
  twitter: z.string().max(80).optional(),
  discord: z.string().max(80).optional(),
});

export async function PUT(req: Request) {
  const session = await getSession();
  // Use the user id (wallet/SIWE accounts have no email).
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  try {
    await prisma.user.update({ where: { id: session.user.id }, data: parsed.data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not save. Is the database configured?' }, { status: 500 });
  }
}
