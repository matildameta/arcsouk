import { prisma } from '@/lib/prisma';
import { getSiteSettings, getAuctions } from '@/lib/store';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { AuctionManager } from '@/components/admin/auction-manager';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Access is enforced by admin/layout.tsx (ADMIN_EMAILS).
  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  let ordersRaw: Array<{
    id: string;
    orderRef: string;
    amountUsdc: number;
    status: string;
    txHash: string | null;
    buyerEmail: string | null;
    shippingAddress: string | null;
    phone: string | null;
    walletAddress: string | null;
    createdAt: Date;
    product: { name: string } | null;
    user: { email: string | null } | null;
  }> = [];
  let banner: { title: string | null; body: string | null; enabled: boolean } | null = null;

  try {
    products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    ordersRaw = await prisma.order.findMany({
      where: { status: { in: ['PAID', 'SHIPPED'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { product: { select: { name: true } }, user: { select: { email: true } } },
    });
    banner = await prisma.contentBlock.findUnique({ where: { key: 'home_banner' } });
  } catch {
    // DB not configured yet — render an empty dashboard.
  }

  const settings = await getSiteSettings();
  const auctionsRaw = await getAuctions(['DRAFT', 'LIVE', 'SETTLED', 'CANCELLED']);
  const auctionProps = auctionsRaw.map((a) => ({
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

  const productProps = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    description: p.description,
    priceUsdc: p.priceUsdc,
    edition: p.edition,
    inventory: p.inventory,
    tone: p.tone,
    images: p.images,
    video: p.video,
    active: p.active,
  }));

  const orderProps = ordersRaw.map((o) => ({
    id: o.id,
    orderRef: o.orderRef,
    amountUsdc: o.amountUsdc,
    status: o.status,
    txHash: o.txHash,
    buyerEmail: o.buyerEmail || o.user?.email || '',
    shippingAddress: o.shippingAddress || '',
    phone: o.phone || '',
    walletAddress: o.walletAddress || '',
    productName: o.product?.name || '—',
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <>
      <AdminDashboard
        products={productProps}
        orders={orderProps}
        banner={{ title: banner?.title || '', body: banner?.body || '', enabled: banner?.enabled || false }}
        settings={settings}
      />
      <AuctionManager auctions={auctionProps} />
    </>
  );
}
