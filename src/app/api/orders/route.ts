import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

const schema = z.object({
  productId: z.string(),
  walletAddress: z.string().optional(),
});

function genRef() {
  return 'ARC-' + Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export async function POST(req: Request) {
  const session = await getSession();
  // Use the user id (wallet/SIWE accounts have no email).
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Please sign in to buy.' }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  try {
    const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
    if (!product || !product.active) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.inventory <= 0) return NextResponse.json({ error: 'This piece is sold out.' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: 'Please sign in to buy.' }, { status: 401 });
    if (!user.shippingAddress || !user.phone) {
      return NextResponse.json({ error: 'Add your shipping address and phone in your profile before buying.', code: 'PROFILE_INCOMPLETE' }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        orderRef: genRef(),
        productId: product.id,
        userId: user.id,
        amountUsdc: product.priceUsdc,
        buyerEmail: user.email,
        shippingAddress: user.shippingAddress,
        phone: user.phone,
        walletAddress: parsed.data.walletAddress ?? user.walletAddress ?? null,
        status: 'AWAITING_PAYMENT',
      },
    });

    return NextResponse.json({
      orderRef: order.orderRef,
      amountUsdc: order.amountUsdc,
      paymentAddress: process.env.NEXT_PUBLIC_PAYMENT_ADDRESS ?? '',
      productName: product.name,
    });
  } catch {
    return NextResponse.json({ error: 'Could not create order. Is the database configured?' }, { status: 500 });
  }
}
