import { getAuctions } from '@/lib/store';
import { BidsClient } from '@/components/bids/bids-client';

export const dynamic = 'force-dynamic';

export default async function BidsPage() {
  const rows = await getAuctions(['LIVE', 'SETTLED']);
  const auctions = rows.map((a) => ({
    id: a.id,
    auctionId: a.auctionId,
    title: a.title,
    image: a.image,
    startBid: a.startBid,
    status: a.status,
    endTime: a.endTime ? new Date(a.endTime).toISOString() : null,
    winner: a.winner,
    winAmount: a.winAmount,
  }));
  return <BidsClient auctions={auctions} />;
}
