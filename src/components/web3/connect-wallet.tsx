'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useReadContract, type Connector } from 'wagmi';
import { Wallet, Loader2, X, ExternalLink } from 'lucide-react';
import { arcTestnet } from '@/lib/chains';
import { shortAddress } from '@/lib/utils';
import { erc20Abi, usdcAddress, fromUnits, USDC_DECIMALS } from '@/lib/usdc';

const EASE = [0.16, 1, 0.3, 1] as const;

function connectorLabel(c: Connector) {
  if (c.id === 'injected' && /injected/i.test(c.name)) return 'Browser wallet';
  return c.name;
}

export function ConnectWallet({ className = '' }: { className?: string }) {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [hasInjected, setHasInjected] = useState(true);

  const usdcOk = /^0x[a-fA-F0-9]{40}$/.test(usdcAddress);
  const { data: decRaw } = useReadContract({
    address: usdcAddress, abi: erc20Abi, functionName: 'decimals', chainId: arcTestnet.id,
    query: { enabled: usdcOk && isConnected },
  });
  const decimals = Number(decRaw ?? USDC_DECIMALS);
  const { data: balRaw } = useReadContract({
    address: usdcAddress, abi: erc20Abi, functionName: 'balanceOf',
    args: address ? [address] : undefined, chainId: arcTestnet.id,
    query: { enabled: usdcOk && isConnected && !!address, refetchInterval: 20000 },
  });
  const balance = balRaw != null ? Math.round(fromUnits(balRaw as bigint, decimals) * 100) / 100 : null;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setHasInjected(typeof window !== 'undefined' && Boolean((window as unknown as { ethereum?: unknown }).ethereum));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const seen = new Set<string>();
  const options = connectors
    .filter((c) => {
      const key = c.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .filter((c) => c.type !== 'injected' || hasInjected);

  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-mono text-[13px] font-medium transition ' + className;

  async function choose(connector: Connector) {
    setError('');
    setPendingId(connector.uid);
    try {
      await connectAsync({ connector });
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message.split('\n')[0] : 'Could not connect';
      setError(/reject|denied|cancell?ed/i.test(msg) ? 'Connection cancelled.' : msg);
    } finally {
      setPendingId(null);
    }
  }

  // ---- Connected, but on the wrong network ----
  if (isConnected && chainId !== arcTestnet.id) {
    return (
      <button onClick={() => switchChain({ chainId: arcTestnet.id })} data-cursor className={`${base} border border-[color:var(--warn)] text-[color:var(--warn)]`}>
        {switching ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />} <span className="hidden sm:inline">Switch to Arc Testnet</span>
      </button>
    );
  }

  // ---- Connected on Arc Testnet: show USDC balance + address ----
  if (isConnected) {
    return (
      <button onClick={() => disconnect()} data-cursor className={`${base} border border-lineStrong text-ink`} title="Disconnect">
        <span className="h-[7px] w-[7px] rounded-full bg-[color:var(--ok)]" style={{ boxShadow: '0 0 8px var(--ok)' }} />
        {balance != null ? (
          <>
            <span className="font-semibold">{balance} USDC</span>
            <span className="hidden text-ink3 sm:inline">· {shortAddress(address)}</span>
          </>
        ) : (
          <span>{shortAddress(address)}</span>
        )}
      </button>
    );
  }

  // ---- Not connected: button + wallet picker (rendered in a portal so it's a true centered window) ----
  return (
    <>
      <button onClick={() => { setError(''); setOpen(true); }} data-cursor className={`${base} bg-brand text-white shadow-glow hover:-translate-y-[2px]`}>
        {isPending ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />}
        <span className="hidden sm:inline">{isPending ? 'Connecting…' : 'Connect wallet'}</span>
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="wallet-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[200] grid place-items-center bg-black/20 p-4"
                role="dialog"
                aria-modal="true"
                aria-label="Connect a wallet"
                onClick={() => setOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 10 }}
                  transition={{ duration: 0.36, ease: EASE }}
                  className="flex max-h-[85vh] w-[min(92vw,390px)] flex-col overflow-hidden rounded-[26px] border border-lineStrong bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] p-6 shadow-[0_30px_80px_-20px_rgba(20,30,70,.45)] backdrop-blur-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-[.2em] text-accent">Arc Souk</div>
                      <h2 className="mt-1 font-display text-[1.35rem] font-semibold tracking-tight">Connect a wallet</h2>
                    </div>
                    <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink2 transition hover:text-ink">
                      <X size={16} />
                    </button>
                  </div>

                  <p className="mt-2 text-[13px] text-ink2">Choose how you’d like to connect to the Arc Testnet.</p>

                  <div className="mt-5 max-h-[52vh] space-y-2 overflow-y-auto pr-1">
                    {options.map((c, i) => (
                      <motion.button
                        key={c.uid}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: EASE, delay: 0.06 + i * 0.05 }}
                        onClick={() => choose(c)}
                        disabled={pendingId !== null}
                        data-cursor
                        className="flex w-full items-center gap-3 rounded-2xl border border-lineStrong bg-[color-mix(in_srgb,var(--text)_6%,var(--bg))] px-4 py-3 text-left transition hover:border-accent hover:bg-[color-mix(in_srgb,var(--accent)_12%,var(--bg))] disabled:opacity-60"
                      >
                        {c.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.icon} alt="" className="h-7 w-7 rounded-lg" />
                        ) : (
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white">
                            <Wallet size={15} />
                          </span>
                        )}
                        <span className="flex-1 font-medium">{connectorLabel(c)}</span>
                        {pendingId === c.uid && <Loader2 size={16} className="animate-spin text-ink2" />}
                      </motion.button>
                    ))}

                    {!hasInjected && (
                      <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noreferrer"
                        data-cursor
                        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-left text-ink2 transition hover:border-accent hover:text-ink"
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-lg border border-line">
                          <ExternalLink size={14} />
                        </span>
                        <span className="flex-1 text-[13.5px]">No wallet detected — install MetaMask</span>
                      </a>
                    )}
                  </div>

                  {error && <p className="mt-4 text-center text-[13px] text-[color:var(--warn)]">{error}</p>}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
