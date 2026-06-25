import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auctionTable } from '@/lib/store';
import { requireAdmin } from '@/lib/session';

const schema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  image: z.string().url(),
  startBid: z.number().positive(),
  durationSec: z.number().int().positive(),
});

// Create a DRAFT auction record + return the tokenURI the contract should store.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  try {
    const a = await auctionTable().create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? '',
        image: parsed.data.image,
        startBid: parsed.data.startBid,
        durationSec: parsed.data.durationSec,
        status: 'DRAFT',
      },
    });
    const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
    return NextResponse.json({ id: a.id, tokenURI: `${base}/api/nft/${a.id}` });
  } catch {
    return NextResponse.json({ error: 'Could not create auction. Run npm run db:push?' }, { status: 400 });
  }
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const rows = await auctionTable().findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ auctions: rows });
  } catch {
    return NextResponse.json({ auctions: [] });
  }
}
