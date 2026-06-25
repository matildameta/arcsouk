'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Wallet, Loader2, Check, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { ConnectWallet } from '@/components/web3/connect-wallet';
import { arcTestnet, explorerTx } from '@/lib/chains';
import { erc20Abi, usdcAddress, paymentAddress, toUnits } from '@/lib/usdc';
import { formatUsdc } from '@/lib/utils';

type Step = 'idle' | 'creating' | 'wallet' | 'pending' | 'verifying' | 'paid' | 'error';

export function BuyButton({ productId, priceUsdc, usdcDecimals }: { productId: string; priceUsdc: number; usdcDecimals: number }) {
  const { status: authStatus } = useSession();
  const { address, isConnected, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isSuccess: confirmed, isError: txFailed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (step !== 'pending' || !txHash) return;
    if (confirmed) verify();
    else if (txFailed) {
      setStep('error');
      setError('The transaction failed on-chain.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed, txFailed]);

  async function verify() {
    setStep('verifying');
    try {
      const res = await fetch(`/api/orders/${orderRef}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      setStep('paid');
    } catch (e) {
      setStep('error');
      setError(e instanceof Error ? e.message : 'Verification failed');
    }
  }

  async function pay() {
    setError('');
    if (!paymentAddress || !usdcAddress) {
      setStep('error');
      setError('Payment is not configured yet (USDC / payment address in .env).');
      return;
    }
    setStep('creating');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, walletAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create order');
      setOrderRef(data.orderRef);

      // Amount uses the token's real decimals (read on the server, passed in) so
      // the wallet shows the right value and verification matches.
      const amount = toUnits(priceUsdc, usdcDecimals);

      setStep('wallet');
      const hash = await writeContractAsync({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [paymentAddress, amount],
        chainId: arcTestnet.id,
      });
      setTxHash(hash);
      setStep('pending');
    } catch (e) {
      setStep('error');
      setError(e instanceof Error ? e.message.split('\n')[0] : 'Payment could not start');
    }
  }

  if (authStatus !== 'authenticated') {
    return (
      <Link href="/auth/signin" data-cursor className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-4 font-semibold text-white shadow-glow transition hover:-translate-y-[2px]">
        <Wallet size={18} /> Sign in to buy
      </Link>
    );
  }

  if (!isConnected || chainId !== arcTestnet.id) {
    return (
      <div className="space-y-2">
        <ConnectWallet />
        <p className="font-mono text-[11px] text-ink3">Connect a wallet on Arc Testnet to pay in USDC.</p>
      </div>
    );
  }

  if (step === 'paid') {
    return (
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center gap-2 font-semibold text-[color:var(--ok)]">
          <Check size={18} /> Payment confirmed
        </div>
        <div className="mt-1 text-[13px] text-ink2">Order {orderRef} is paid — we&apos;ll ship it to you.</div>
        <div className="mt-2 flex gap-4 text-[12px]">
          <Link href="/profile" className="text-accent">My orders →</Link>
          {txHash && (
            <a href={explorerTx(txHash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink3">
              transaction <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    );
  }

  const busy = step === 'creating' || step === 'wallet' || step === 'pending' || step === 'verifying';
  const label =
    step === 'creating' ? 'Creating order…'
    : step === 'wallet' ? 'Confirm in your wallet…'
    : step === 'pending' ? 'Waiting for confirmation…'
    : step === 'verifying' ? 'Verifying payment…'
    : `Pay ${formatUsdc(priceUsdc)} USDC`;

  return (
    <div className="space-y-2">
      <button onClick={pay} disabled={busy} data-cursor className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-4 font-semibold text-white shadow-glow transition hover:-translate-y-[2px] disabled:opacity-70">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />} {label}
      </button>
      {txHash && (step === 'pending' || step === 'verifying') && (
        <a href={explorerTx(txHash)} target="_blank" rel="noreferrer" className="block font-mono text-[11px] text-ink3">
          view transaction ↗
        </a>
      )}
      {step === 'error' && <p className="text-[13px] text-[color:var(--warn)]">{error}</p>}
    </div>
  );
}
