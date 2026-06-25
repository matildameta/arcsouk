import { createPublicClient, http } from 'viem';
import { arcTestnet } from '@/lib/chains';
import { erc20Abi, usdcAddress, USDC_DECIMALS } from '@/lib/usdc';

let cached: number | null = null;

/**
 * Reads the USDC token's real decimals on-chain from the server (reliable — no
 * browser CORS limits). Falls back to USDC_DECIMALS. Cached after first success.
 * Buy + verify both use this so the paid amount and the expected amount always match.
 */
export async function getUsdcDecimals(): Promise<number> {
  if (cached != null) return cached;
  try {
    if (/^0x[a-fA-F0-9]{40}$/.test(usdcAddress)) {
      const client = createPublicClient({ chain: arcTestnet, transport: http() });
      const d = Number(await client.readContract({ address: usdcAddress, abi: erc20Abi, functionName: 'decimals' }));
      if (Number.isFinite(d) && d > 0) {
        cached = d;
        return d;
      }
    }
  } catch {
    /* fall back */
  }
  return USDC_DECIMALS;
}
