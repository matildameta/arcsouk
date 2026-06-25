import { NextResponse } from 'next/server';
import { auctionTable } from '@/lib/store';

export const dynamic = 'force-dynamic';

// ERC-721 metadata for an auction NFT. Used as the on-chain tokenURI.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const a = await auctionTable().findUnique({ where: { id: params.id } });
    if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      name: a.title || 'Arc Souk piece',
      description: a.description || 'A 1/1 Arc Souk auction piece.',
      image: a.image,
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
