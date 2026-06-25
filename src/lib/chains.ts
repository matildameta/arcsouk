import { defineChain } from 'viem';

/**
 * Circle Arc Testnet.
 * NOTE: the native gas token (USDC) uses 18 decimals, but the USDC ERC-20
 * interface uses 6 decimals. For balances and transfers we ALWAYS use the
 * ERC-20 interface (6 decimals) — see src/lib/usdc.ts.
 */
export const arcTestnet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042002),
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL ?? 'https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'Arcscan', url: process.env.NEXT_PUBLIC_ARC_EXPLORER ?? 'https://testnet.arcscan.app' },
  },
  testnet: true,
});

export function explorerTx(hash: string) {
  const base = process.env.NEXT_PUBLIC_ARC_EXPLORER ?? 'https://testnet.arcscan.app';
  return `${base}/tx/${hash}`;
}
