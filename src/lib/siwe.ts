import crypto from 'crypto';

// Stateless, signed nonce for Sign-In-With-Ethereum. No DB needed; valid 10 min.
const TTL_MS = 10 * 60 * 1000;

function secret() {
  return process.env.NEXTAUTH_SECRET || 'arc-souk-dev-secret';
}

export function createNonce(): string {
  const ts = Date.now().toString();
  const sig = crypto.createHmac('sha256', secret()).update(ts).digest('hex').slice(0, 24);
  return `${ts}.${sig}`;
}

export function verifyNonce(nonce: string): boolean {
  const [ts, sig] = (nonce || '').split('.');
  if (!ts || !sig) return false;
  if (!/^\d+$/.test(ts) || Date.now() - Number(ts) > TTL_MS) return false;
  const expected = crypto.createHmac('sha256', secret()).update(ts).digest('hex').slice(0, 24);
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

/** The exact message the wallet signs. Kept identical on client and server. */
export function siweMessage(address: string, nonce: string): string {
  return `Arc Souk wants you to sign in with your wallet.\n\nWallet: ${address}\nNonce: ${nonce}`;
}
