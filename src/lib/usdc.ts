// USDC ERC-20 interface on Arc Testnet.
// We read decimals() from the token at runtime; this is the fallback when that
// read is unavailable (e.g. the browser can't reach the custom RPC). Arc USDC is
// 18-decimals — override with NEXT_PUBLIC_USDC_DECIMALS if your token differs.
export const USDC_DECIMALS = (() => {
  const n = Number(process.env.NEXT_PUBLIC_USDC_DECIMALS);
  return Number.isFinite(n) && n > 0 ? n : 18;
})();

export const usdcAddress = (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? '') as `0x${string}`;
export const paymentAddress = (process.env.NEXT_PUBLIC_PAYMENT_ADDRESS ?? '') as `0x${string}`;

export const erc20Abi = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
  },
] as const;

/** Convert a human USDC amount (e.g. 3) to base units using the token's real decimals. Float-safe. */
export function toUnits(amount: number, decimals: number): bigint {
  const s = (amount ?? 0).toString();
  const neg = s.startsWith('-');
  const [intPart, fracPart = ''] = (neg ? s.slice(1) : s).split('.');
  const frac = (fracPart + '0'.repeat(decimals)).slice(0, decimals);
  const digits = (intPart + frac).replace(/^0+(?=\d)/, '');
  const v = BigInt(digits || '0');
  return neg ? -v : v;
}

/** Convert base units back to a human number using the token's real decimals. */
export function fromUnits(units: bigint, decimals: number): number {
  if (decimals <= 0) return Number(units);
  const s = units.toString().padStart(decimals + 1, '0');
  const intPart = s.slice(0, s.length - decimals);
  const fracPart = s.slice(s.length - decimals).replace(/0+$/, '');
  return Number(fracPart ? `${intPart}.${fracPart}` : intPart);
}

/** @deprecated use toUnits(amount, decimals). Kept for compatibility. */
export function toUsdcUnits(amount: number): bigint {
  return toUnits(amount, USDC_DECIMALS);
}
