import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from '@/components/profile/profile-form';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params: { locale } }: { params: { locale: string } }) {
  const session = await getSession();
  if (!session?.user) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/profile`);
  }

  // Load by user id (wallet/SIWE accounts have no email).
  const userId = session.user.id;
  let user: Awaited<ReturnType<typeof prisma.user.findUnique>> = null;
  let orders: Array<{ id: string; orderRef: string; amountUsdc: number; status: string; product: { name: string } | null }> = [];

  if (userId) {
    try {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        orders = await prisma.order.findMany({
          where: { userId: user.id, status: { in: ['PAID', 'SHIPPED'] } },
          orderBy: { createdAt: 'desc' },
          include: { product: { select: { name: true } } },
        });
      }
    } catch {
      // DB not configured yet
    }
  }

  const profile = {
    name: user?.name || session.user.name || '',
    email: user?.email || session.user.email || '',
    phone: user?.phone || '',
    shippingAddress: user?.shippingAddress || '',
    walletAddress: user?.walletAddress || '',
    twitter: user?.twitter || '',
    discord: user?.discord || '',
  };

  const orderProps = orders.map((o) => ({
    id: o.id,
    orderRef: o.orderRef,
    amountUsdc: o.amountUsdc,
    status: o.status,
    productName: o.product?.name || '—',
  }));

  return <ProfileForm profile={profile} orders={orderProps} />;
}
