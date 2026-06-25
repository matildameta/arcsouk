import { NextResponse } from 'next/server';
import { createNonce } from '@/lib/siwe';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ nonce: createNonce() });
}
