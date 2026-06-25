import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPublicClient, http, decodeEventLog } from 'viem';
import { prisma } from '@/lib/prisma';
import { arcTestnet } from '@/lib/chains';
import { erc20Abi, usdcAddress, toUnits } from '@/lib/usdc';
import { getUsdcDecimals } from '@/lib/usdc-server';

const schema = z.object({ txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'Invalid transaction hash') });

export async function POST(req: Request, { params }: { params: { ref: string } }) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid transaction hash' }, { status: 400 });

  const payTo = (process.env.NEXT_PUBLIC_PAYMENT_ADDRESS ?? '').toLowerCase();
  if (!usdcAddress || !payTo) {
    return NextResponse.json({ error: 'Payment is not configured (USDC / payment address).' }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({ where: { orderRef: params.ref } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status === 'PAID' || order.status === 'SHIPPED') {
      return NextResponse.json({ ok: true, status: order.status });
    }

    const client = createPublicClient({ chain: arcTestnet, transport: http() });
    const receipt = await client.getTransactionReceipt({ hash: parsed.data.txHash as `0x${string}` });
    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'The transaction did not succeed on-chain.' }, { status: 400 });
    }

    // Use the token's real decimals (same source the buy flow uses) so amounts match.
    const decimals = await getUsdcDecimals();
    const expected = toUnits(order.amountUsdc, decimals);
    let matched = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== usdcAddress.toLowerCase()) continue;
      try {
        const ev = decodeEventLog({ abi: erc20Abi, data: log.data, topics: log.topics });
        if (ev.eventName === 'Transfer') {
          const args = ev.args as unknown as { to: string; value: bigint };
          if (args.to.toLowerCase() === payTo && args.value >= expected) {
            matched = true;
            break;
          }
        }
      } catch {
        /* not a Transfer log */
      }
    }

    if (!matched) {
      return NextResponse.json({ error: 'No matching USDC payment was found in this transaction.' }, { status: 400 });
    }

    await prisma.order.update({ where: { id: order.id }, data: { status: 'PAID', txHash: parsed.data.txHash } });
    if (order.productId) {
      await prisma.product.update({ where: { id: order.productId }, data: { inventory: { decrement: 1 } } }).catch(() => {});
    }
    return NextResponse.json({ ok: true, status: 'PAID' });
  } catch {
    return NextResponse.json({ error: 'Could not verify yet — wait for the transaction to confirm, then retry.' }, { status: 400 });
  }
}
