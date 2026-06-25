'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { Gavel, Loader2, Trophy, Timer, Users, ZoomIn } from 'lucide-react';
import { ConnectWallet } from '@/components/web3/connect-wallet';
import { Lightbox } from '@/components/site/lightbox';
import { Reveal } from '@/components/site/reveal';
import { auctionAbi, auctionAddress, auctionConfigured } from '@/lib/auction';
import { erc20Abi, usdcAddress, toUnits, fromUnits, USDC_DECIMALS } from '@/lib/usdc';
import { arcTestnet } from '@/lib/chains';

export type BidAuction = {
  id: string;
  auctionId: number | null;
  title: string;
  image: string;
  startBid: number;
  status: string;
  endTime: string | null;
  winner: string | null;
  winAmount: number | null;
};

const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');
const ZERO = '0x0000000000000000000000000000000000000000';

function useCountdown(endMs: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (endMs == null) return { ended: false, label: '—' };
  const diff = endMs - now;
  if (diff <= 0) return { ended: true, label: '' };
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const label = d > 0
    ? `${d}d ${h}h ${m}m`
    : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return { ended: false, label };
}

export function BidsClient({ auctions }: { auctions: BidAuction[] }) {
  const t = useTranslations('bids');
  const { data: decRaw } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    chainId: arcTestnet.id,
    query: { enabled: /^0x[a-fA-F0-9]{40}$/.test(usdcAddress) },
  });
  const decimals = Number(decRaw ?? USDC_DECIMALS);

  return (
    <div className="px-6 pb-32 pt-[150px] sm:px-9">
      <div className="mx-auto max-w-[1120px]">
        <Reveal>
          <div className="mb-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[.2em] text-accent">
            <Gavel size={14} /> Arc Souk
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-semibold tracking-[-.03em]">{t('title')}</h1>
          <p className="mt-4 max-w-[62ch] text-[1.04rem] text-ink2">{t('subtitle')}</p>
        </Reveal>

        {!auctionConfigured ? (
          <p className="mt-12 rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-ink3">{t('notConfigured')}</p>
        ) : auctions.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-ink3">{t('none')}</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-7 lg:grid-cols-2">
            {auctions.map((a, i) => (
              <Reveal key={a.id} className="h-full" delay={(i % 2) * 0.08}>
                <AuctionCard auction={a} decimals={decimals} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AuctionCard({ auction, decimals }: { auction: BidAuction; decimals: number }) {
  const t = useTranslations('bids');
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });

  const enabled = auctionConfigured && auction.auctionId != null;
  const { data: chain, refetch } = useReadContract({
    address: auctionAddress,
    abi: auctionAbi,
    functionName: 'getAuction',
    args: enabled ? [BigInt(auction.auctionId as number)] : undefined,
    chainId: arcTestnet.id,
    query: { enabled, refetchInterval: 15000 },
  });

  const highestBidder = chain ? (chain[3] as string) : undefined;
  const highestBidUnits = chain ? (chain[4] as bigint) : BigInt(0);
  const chainEnd = chain ? Number(chain[2] as bigint) * 1000 : null;
  const onchainSettled = chain ? (chain[5] as boolean) : false;

  const endMs = chainEnd ?? (auction.endTime ? new Date(auction.endTime).getTime() : null);
  const { ended, label } = useCountdown(endMs);

  const hasBids = highestBidUnits > BigInt(0);
  const currentHuman = hasBids ? fromUnits(highestBidUnits, decimals) : 0;
  const isSettled = auction.status === 'SETTLED' || onchainSettled;

  const [amount, setAmount] = useState<number>(auction.startBid);
  const [step, setStep] = useState<'idle' | 'approving' | 'bidding'>('idle');
  const [error, setError] = useState('');
  const [bids, setBids] = useState<{ addr: string; amount: bigint }[]>([]);

  // Image lightbox (same component the product page uses).
  const images = [auction.image].filter(Boolean) as string[];
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!publicClient || auction.auctionId == null) return;
      try {
        const logs = await publicClient.getContractEvents({
          address: auctionAddress,
          abi: auctionAbi,
          eventName: 'BidPlaced',
          args: { auctionId: BigInt(auction.auctionId) },
          fromBlock: 'earliest',
        });
        if (!active) return;
        const list = logs
          .map((l) => {
            const ar = (l as unknown as { args: { bidder: `0x${string}`; amount: bigint } }).args;
            return { addr: ar.bidder, amount: ar.amount };
          })
          .reverse();
        setBids(list);
      } catch {
        /* RPC may not support log queries — degrade gracefully */
      }
    })();
    return () => {
      active = false;
    };
  }, [publicClient, auction.auctionId, highestBidUnits]);

  async function placeBid() {
    setError('');
    if (!publicClient || !address || auction.auctionId == null) return;
    if (!(amount > 0) || (hasBids ? amount <= currentHuman : amount < auction.startBid)) {
      setError(t('mustBeHigher'));
      return;
    }
    try {
      const units = toUnits(amount, decimals);
      const allowance = (await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, auctionAddress],
      })) as bigint;
      if (allowance < units) {
        setStep('approving');
        const ah = await writeContractAsync({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [auctionAddress, units],
          chainId: arcTestnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash: ah });
      }
      setStep('bidding');
      const bh = await writeContractAsync({
        address: auctionAddress,
        abi: auctionAbi,
        functionName: 'bid',
        args: [BigInt(auction.auctionId), units],
        chainId: arcTestnet.id,
      });
      await publicClient.waitForTransactionReceipt({ hash: bh });
      await refetch();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message.split('\n')[0] : 'Bid failed');
    } finally {
      setStep('idle');
    }
  }

  const busy = step !== 'idle';
  const winnerAddr = auction.winner || (isSettled && highestBidder && highestBidder !== ZERO ? highestBidder : undefined);
  const winnerAmount = auction.winAmount ?? (hasBids ? currentHuman : 0);
  const showBidForm = !isSettled && !ended;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface backdrop-blur">
      <div className="group relative h-[260px] shrink-0 overflow-hidden bg-surface2">
        <button
          type="button"
          onClick={() => images.length > 0 && setLightboxOpen(true)}
          aria-label={`Zoom ${auction.title}`}
          className="absolute inset-0 h-full w-full cursor-zoom-in"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={auction.image} alt={auction.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-105" />
          <span className="pointer-events-none absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
            <ZoomIn size={16} />
          </span>
        </button>
        <span
          className="pointer-events-none absolute left-4 top-4 z-[2] inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1.5 font-mono text-[11px] font-medium text-ink backdrop-blur dark:bg-black/40 dark:text-white"
          style={isSettled ? undefined : { color: ended ? 'var(--warn)' : 'var(--ok)' }}
        >
          <span className="h-[6px] w-[6px] rounded-full" style={{ background: isSettled ? 'var(--text-3)' : ended ? 'var(--warn)' : 'var(--ok)' }} />
          {isSettled ? t('settled') : ended ? t('ended') : t('live')}
        </span>
      </div>

      <div className="p-6">
        <div className="font-display text-[1.4rem] font-semibold tracking-tight">{auction.title}</div>

        {/* Winner announcement */}
        {isSettled && winnerAddr ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] p-5 text-center">
            <Trophy size={26} className="mx-auto text-accent" />
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[.2em] text-ink3">{t('winner')}</div>
            <div className="mt-1 font-display text-[1.15rem] font-semibold">
              {address && winnerAddr.toLowerCase() === address.toLowerCase() ? `🎉 ${t('you')}` : short(winnerAddr)}
            </div>
            <div className="mt-1 font-mono text-[13px] text-ink2">{t('wonFor')} {winnerAmount} USDC</div>
          </div>
        ) : isSettled ? (
          <div className="mt-4 rounded-2xl border border-line bg-surface2 p-5 text-center text-[13px] text-ink3">{t('settled')}</div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-surface2 px-4 py-3">
                <div className="font-mono text-[11px] uppercase tracking-[.15em] text-ink3">{hasBids ? t('currentBid') : t('startingBid')}</div>
                <div className="mt-1 font-mono text-[1.4rem] font-semibold">{hasBids ? currentHuman : auction.startBid} <span className="text-[.7rem] text-accent">USDC</span></div>
              </div>
              <div className="rounded-xl border border-line bg-surface2 px-4 py-3">
                <div className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[.15em] text-ink3"><Timer size={12} /> {ended ? t('ended') : t('endsIn')}</div>
                <div className="mt-1 font-mono text-[1.4rem] font-semibold tabular-nums">{ended ? '—' : label}</div>
              </div>
            </div>

            {hasBids && highestBidder && (
              <div className="mt-3 font-mono text-[12px] text-ink3">
                {t('highestBidder')}: <span className="text-ink">{address && highestBidder.toLowerCase() === address.toLowerCase() ? t('you') : short(highestBidder)}</span>
              </div>
            )}

            {/* Bid form */}
            {showBidForm && (
              <div className="mt-5">
                {!isConnected ? (
                  <div className="space-y-2">
                    <ConnectWallet />
                    <p className="font-mono text-[11px] text-ink3">{t('connectToBid')}</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={auction.startBid}
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder={t('bidPh')}
                      className="w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-[15px] text-ink outline-none transition focus:border-accent"
                    />
                    <button
                      onClick={placeBid}
                      disabled={busy}
                      data-cursor
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white shadow-glow transition hover:-translate-y-[1px] disabled:opacity-60"
                    >
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <Gavel size={16} />}
                      {step === 'approving' ? t('approving') : step === 'bidding' ? t('bidding') : t('placeBid')}
                    </button>
                  </div>
                )}
                {error && <p className="mt-2 text-[13px] text-[color:var(--warn)]">{error}</p>}
              </div>
            )}
          </>
        )}

        {/* Participants */}
        {bids.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-2 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[.15em] text-ink3">
              <Users size={12} /> {t('participants')} · {bids.length}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {bids.slice(0, 8).map((b, i) => (
                <span key={i} className="rounded-full border border-line bg-surface2 px-2.5 py-1 font-mono text-[11px] text-ink2">
                  {short(b.addr)} · {fromUnits(b.amount, decimals)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <Lightbox
        open={lightboxOpen}
        images={images}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
        alt={auction.title}
      />
    </div>
  );
}
