import { getContentBlock, getProducts, hasLiveAuction } from '@/lib/store';
import { HomeClient } from '@/components/site/home-client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [b, products, auctionLive] = await Promise.all([
    getContentBlock('home_banner'),
    getProducts(),
    hasLiveAuction(),
  ]);
  const banner = b ? { title: b.title ?? '', body: b.body ?? '' } : null;
  return <HomeClient banner={banner} featured={products.slice(0, 3)} auctionLive={auctionLive} />;
}
