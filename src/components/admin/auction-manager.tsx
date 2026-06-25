'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { decodeEventLog } from 'viem';
import { Gavel, Upload, Loader2, Check, Trophy, Clock, Trash2 } from 'lucide-react';
import { ConnectWallet } from '@/components/web3/connect-wallet';
import { auctionAbi, auctionAddress, auctionConfigured } from '@/lib/auction';
import { erc20Abi, usdcAddress, toUnits, fromUnits, USDC_DECIMALS } from '@/lib/usdc';
import { arcTestnet } from '@/lib/chains';

export type AdminAuction = {
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

const inputCls = 'w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-[14px] text-ink outline-none transition focus:border-accent';

export function AuctionManager({ auctions }: { auctions: AdminAuction[] }) {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startBid, setStartBid] = useState(1);
  const [hours, setHours] = useState(24);
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [settling, setSettling] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function readDecimals(): Promise<number> {
    try {
      if (publicClient && usdcAddress) {
        return Number(await publicClient.readContract({ address: usdcAddress, abi: erc20Abi, functionName: 'decimals' }));
      }
    } catch { /* ignore */ }
    return USDC_DECIMALS;
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setImage(data.url);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  }

  async function createAuction() {
    setMsg(null);
    if (!title.trim() || !image) { setMsg({ ok: false, text: 'Add a title and an image first.' }); return; }
    if (startBid <= 0 || hours <= 0) { setMsg({ ok: false, text: 'Start bid and duration must be positive.' }); return; }
    if (!publicClient) { setMsg({ ok: false, text: 'Wallet/network not ready.' }); return; }
    setBusy(true);
    try {
      // 1) create the off-chain draft + get the tokenURI
      const draftRes = await fetch('/api/admin/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, image, startBid, durationSec: Math.round(hours * 3600) }),
      });
      const draft = await draftRes.json();
      if (!draftRes.ok) throw new Error(draft.error || 'Could not create draft');

      // 2) on-chain: mint NFT + open auction (admin/owner wallet signs)
      const decimals = await readDecimals();
      const hash = await writeContractAsync({
        address: auctionAddress,
        abi: auctionAbi,
        functionName: 'createAuction',
        args: [draft.tokenURI, toUnits(startBid, decimals), BigInt(Math.round(hours * 3600))],
        chainId: arcTestnet.id,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // 3) parse the AuctionCreated event for the on-chain id + end time
      let onChainId: bigint | undefined;
      let tokenId: bigint | undefined;
      let endTime: bigint | undefined;
      for (const log of receipt.logs) {
        try {
          const ev = decodeEventLog({ abi: auctionAbi, data: log.data, topics: log.topics });
          if (ev.eventName === 'AuctionCreated') {
            const a = ev.args as unknown as { auctionId: bigint; tokenId: bigint; endTime: bigint };
            onChainId = a.auctionId; tokenId = a.tokenId; endTime = a.endTime;
            break;
          }
        } catch { /* not our event */ }
      }

      // 4) link the on-chain auction back to the draft
      await fetch(`/api/admin/auctions/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId: onChainId ? Number(onChainId) : undefined,
          tokenId: tokenId ? Number(tokenId) : undefined,
          txHash: hash,
          endTime: endTime ? new Date(Number(endTime) * 1000).toISOString() : undefined,
          status: 'LIVE',
        }),
      });

      setMsg({ ok: true, text: 'Auction is live! It now shows on the Bids page.' });
      setTitle(''); setDescription(''); setImage(''); setStartBid(1); setHours(24);
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message.split('\n')[0] : 'Could not create auction' });
    } finally {
      setBusy(false);
    }
  }

  async function settle(a: AdminAuction) {
    if (a.auctionId == null || !publicClient) return;
    setSettling(a.id);
    setMsg(null);
    try {
      const hash = await writeContractAsync({
        address: auctionAddress,
        abi: auctionAbi,
        functionName: 'settleAuction',
        args: [BigInt(a.auctionId)],
        chainId: arcTestnet.id,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // read the final winner/amount on-chain
      const decimals = await readDecimals();
      const res = (await publicClient.readContract({
        address: auctionAddress,
        abi: auctionAbi,
        functionName: 'getAuction',
        args: [BigInt(a.auctionId)],
      })) as readonly [bigint, bigint, bigint, `0x${string}`, bigint, boolean, string];
      const highestBidder = res[3];
      const highestBid = res[4];
      const hasWinner = highestBidder && highestBidder !== '0x0000000000000000000000000000000000000000';

      await fetch(`/api/admin/auctions/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SETTLED',
          winner: hasWinner ? highestBidder : undefined,
          winAmount: hasWinner ? fromUnits(highestBid, decimals) : undefined,
        }),
      });
      setMsg({ ok: true, text: hasWinner ? 'Settled — NFT sent to the winner, USDC paid out.' : 'Settled — no bids, NFT returned to you.' });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message.split('\n')[0] : 'Could not settle' });
    } finally {
      setSettling(null);
    }
  }

  async function delAuction(id: string) {
    if (!confirm('Delete this auction from the site? (The on-chain auction stays, but it is removed from the Bids page.)')) return;
    await fetch(`/api/admin/auctions/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="px-9 pb-32">
      <div className="mx-auto max-w-[1220px]">
        <div className="rounded-3xl border border-line bg-surface p-6 backdrop-blur">
          <div className="mb-1 flex items-center gap-2 font-display text-[1.2rem] font-medium">
            <Gavel size={18} className="text-accent" /> Auctions (1 / 1 NFTs)
          </div>
          <p className="mb-5 text-[13px] text-ink3">
            Upload an image, set a starting bid + duration, then sign with your <span className="font-mono">admin (owner) wallet</span> to mint the NFT and open the auction on the Bids page.
          </p>

          {!auctionConfigured ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface2 p-5 text-[13px] text-ink2">
              The auction contract isn&apos;t configured yet. Deploy <span className="font-mono">contracts/ArcAuctionHouse.sol</span> (see <span className="font-mono">AUCTION-DEPLOY.md</span>) and set <span className="font-mono">NEXT_PUBLIC_AUCTION_ADDRESS</span>, then redeploy.
            </div>
          ) : !isConnected ? (
            <div className="space-y-2">
              <ConnectWallet />
              <p className="font-mono text-[11px] text-ink3">Connect your owner wallet on Arc Testnet to create auctions.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input className={inputCls} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputCls} type="number" min={0} step="0.01" placeholder="Start bid (USDC)" value={startBid} onChange={(e) => setStartBid(Number(e.target.value))} />
                  <input className={inputCls} type="number" min={1} placeholder="Duration (hours)" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
                </div>
              </div>
              <textarea className={`${inputCls} mt-3`} rows={2} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-[13px] transition hover:border-lineStrong">
                  <Upload size={15} /> {image ? 'Change image' : 'Upload image'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                </label>
                {uploading && <Loader2 size={16} className="animate-spin text-accent" />}
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="h-14 w-14 rounded-lg border border-line object-cover" />
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <button onClick={createAuction} disabled={busy} data-cursor className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 font-semibold text-white shadow-glow transition hover:-translate-y-[1px] disabled:opacity-60">
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Gavel size={15} />} Create auction
                </button>
                {msg && (
                  <span className={`inline-flex items-center gap-1.5 text-[13px] ${msg.ok ? 'text-[color:var(--ok)]' : 'text-[color:var(--warn)]'}`}>
                    {msg.ok && <Check size={14} />} {msg.text}
                  </span>
                )}
              </div>
            </>
          )}

          {/* existing auctions */}
          {auctions.length > 0 && (
            <div className="mt-7 space-y-2">
              <div className="font-mono text-[12px] uppercase tracking-[.15em] text-ink3">All auctions</div>
              {auctions.map((a) => {
                const ended = a.endTime ? new Date(a.endTime).getTime() < Date.now() : false;
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface2 px-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.image} alt="" className="h-12 w-12 rounded-lg border border-line object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{a.title} {a.auctionId != null && <span className="font-mono text-[11px] text-ink3">#{a.auctionId}</span>}</div>
                      <div className="font-mono text-[12px] text-ink3">
                        {a.status}{a.winner ? <> · winner {a.winner.slice(0, 6)}…{a.winner.slice(-4)} ({a.winAmount} USDC)</> : null}
                      </div>
                    </div>
                    {a.status === 'LIVE' && a.auctionId != null && (
                      ended ? (
                        <button onClick={() => settle(a)} disabled={settling === a.id} data-cursor className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-[12px] transition hover:border-lineStrong disabled:opacity-60">
                          {settling === a.id ? <Loader2 size={13} className="animate-spin" /> : <Trophy size={13} />} Settle
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ink3"><Clock size={12} /> live</span>
                      )
                    )}
                    <button onClick={() => delAuction(a.id)} data-cursor className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-[color:var(--warn)] transition hover:border-lineStrong" aria-label="Delete auction"><Trash2 size={14} /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
